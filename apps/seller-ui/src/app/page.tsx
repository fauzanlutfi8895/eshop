"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Users,
  Star,
  Globe,
  Edit,
  Facebook,
  Instagram,
  Twitter,
  Camera,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import EditProfileModal from "@/shared/component/modals/edit.profile.modal";
import BannerChangeModal from "@/shared/component/modals/banner.change.modal";
import ProductsTab from "@/shared/component/tabs/products.tab";
import OffersTab from "@/shared/component/tabs/offers.tab";
import ReviewsTab from "@/shared/component/tabs/reviews.tab";
import useSeller from "@/hook/useSeller";
import { SHOP_IMAGE_PLACEHOLDER } from "@/shared/constant";
import useDiscountCodes from "@/hook/useDiscountCodes";
import axiosInstance from "@/utils/axiosInstance";
import toast from "react-hot-toast";

type TabType = "products" | "offers" | "reviews";

interface SellerProfile {
  avatar: string;
  name: string;
  description: string;
  followers: string;
  rating: number;
  schedule: string;
  address: string;
  joinedAt: string;
  website: string;
  socialMedia: {
    facebook: string | null;
    instagram: string | null;
    twitter: string | null;
    tiktok: string | null;
  };
}

const Page = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("products");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [coverImage, setCoverImage] = useState<string>(
    "bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"
  );

  const { seller, isPending } = useSeller();
  const { discountCodes, isLoading: discountCodesLoading } = useDiscountCodes();

  const [sellerProfile, setSellerProfile] = useState<SellerProfile>({
    avatar: SHOP_IMAGE_PLACEHOLDER,
    name: "Unknown Shop",
    description: "No description available",
    followers: "0",
    rating: 0,
    schedule: "No schedule available",
    address: "No address available",
    joinedAt: "No joined date available",
    website: "No website available",
    socialMedia: {
      facebook: null,
      instagram: null,
      twitter: null,
      tiktok: null,
    },
  });

  // Update sellerProfile and coverImage when seller data is loaded
  useEffect(() => {
    if (seller) {
      setSellerProfile({
        avatar: seller?.shop?.avatar || SHOP_IMAGE_PLACEHOLDER,
        name: seller?.shop?.name || "Unknown Shop",
        description: seller?.shop?.bio || "No description available",
        followers: seller?.shop?.followers?.length?.toString() || "0",
        rating: seller?.shop?.rating || 0,
        schedule: seller?.shop?.opening_hours || "No schedule available",
        address: seller?.shop?.address || "No address available",
        joinedAt: seller?.createdAt
          ? new Date(seller.createdAt).toLocaleDateString()
          : "No joined date available",
        website: seller?.shop?.website || "No website available",
        socialMedia: {
          facebook:
            seller?.shop?.socialLink?.find(
              (link: any) => link.platform === "facebook"
            )?.url || null,
          instagram:
            seller?.shop?.socialLink?.find(
              (link: any) => link.platform === "instagram"
            )?.url || null,
          twitter:
            seller?.shop?.socialLink?.find(
              (link: any) => link.platform === "twitter"
            )?.url || null,
          tiktok:
            seller?.shop?.socialLink?.find(
              (link: any) => link.platform === "tiktok"
            )?.url || null,
        },
      });

      // Set cover image from database
      if (seller?.shop?.coverBanner) {
        setCoverImage(seller.shop.coverBanner);
      }
    }
  }, [seller]);

  const handleBackToDashboard = () => {
    window.location.href = "/dashboard";
  };

  const handleEditProfile = () => {
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async (data: {
    avatar: string;
    name: string;
    description: string;
    schedule: string;
    address: string;
  }) => {
    try {
      // Call API to update profile
      await axiosInstance.put("/seller/api/update-profile", {
        avatar: data.avatar,
        name: data.name,
        description: data.description,
        schedule: data.schedule,
        address: data.address,
      });

      // Update local state
      setSellerProfile((prev) => ({
        ...prev,
        avatar: data.avatar,
        name: data.name,
        description: data.description,
        schedule: data.schedule,
        address: data.address,
      }));

      // Close modal
      setIsEditModalOpen(false);

      // Show success message
      toast.success("Profile updated successfully!");

      // Invalidate and refetch seller data to update cache
      await queryClient.invalidateQueries({ queryKey: ["seller"] });
    } catch (error: any) {
      console.error("Profile update error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        "Failed to update profile. Please try again.";
      toast.error(errorMessage);
    }
  };

  const handleChangeCover = () => {
    setIsBannerModalOpen(true);
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleBannerUpload = async (
    file: File
  ): Promise<{ file_url: string; fileId: string }> => {
    try {
      const fileName = await convertFileToBase64(file);

      const response = await axiosInstance.post("/seller/api/upload-banner", {
        fileName,
      });

      return {
        fileId: response.data.fileId,
        file_url: response.data.file_url,
      };
    } catch (error: any) {
      console.error("Banner upload error:", error);
      throw error;
    }
  };

  const handleBannerConfirm = async (newBannerUrl: string, fileId: string) => {
    try {
      // Update banner in database
      await axiosInstance.put("/seller/api/update-banner", {
        coverBanner: newBannerUrl,
        fileId,
      });

      // Update local state
      setCoverImage(newBannerUrl);
      setIsBannerModalOpen(false);
      toast.success("Banner updated successfully!");

      // Invalidate and refetch seller data to update cache
      await queryClient.invalidateQueries({ queryKey: ["seller"] });
    } catch (error: any) {
      console.error("Banner update error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        "Failed to update banner. Please try again.";
      toast.error(errorMessage);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "products":
        // return <OffersTab />;
        return <ProductsTab seller={seller} />;
      case "offers":
        return (
          <OffersTab
            discountCodes={discountCodes}
            discountCodesLoading={discountCodesLoading}
          />
        );
      case "reviews":
        return <ReviewsTab />;
      default:
        // return <OffersTab />;
        return <ProductsTab seller={seller} />;
    }
  };

  const tabs = [
    { id: "products" as TabType, label: "Products" },
    { id: "offers" as TabType, label: "Offers" },
    { id: "reviews" as TabType, label: "Reviews" },
  ];

  const socialMediaLinks = [
    {
      name: "Facebook",
      icon: Facebook,
      url: sellerProfile.socialMedia.facebook,
      color: "text-blue-500 hover:text-blue-600",
    },
    {
      name: "Instagram",
      icon: Instagram,
      url: sellerProfile.socialMedia.instagram,
      color: "text-pink-500 hover:text-pink-600",
    },
    {
      name: "Twitter",
      icon: Twitter,
      url: sellerProfile.socialMedia.twitter,
      color: "text-sky-500 hover:text-sky-600",
    },
  ];

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={
              star <= Math.floor(rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-600"
            }
          />
        ))}
        <span className="ml-1 text-white font-medium">{rating.toFixed(1)}</span>
      </div>
    );
  };

  // Skeleton Loaders
  const ProfileCardSkeleton = () => (
    <div className="lg:col-span-2 bg-gray-800 rounded-lg shadow-xl p-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Avatar Skeleton */}
        <div className="flex-shrink-0">
          <div className="w-32 h-32 rounded-full border-4 border-gray-700 bg-gray-700 animate-pulse"></div>
        </div>

        {/* Info Skeleton */}
        <div className="flex-1">
          <div className="mb-3">
            <div className="h-8 bg-gray-700 rounded w-3/4 mb-3 animate-pulse"></div>
            <div className="h-4 bg-gray-700 rounded w-full mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-700 rounded w-5/6 animate-pulse"></div>
          </div>

          {/* Stats Skeleton */}
          <div className="flex flex-wrap items-center gap-6 mt-4 mb-4">
            <div className="h-6 bg-gray-700 rounded w-32 animate-pulse"></div>
            <div className="h-6 bg-gray-700 rounded w-24 animate-pulse"></div>
          </div>

          {/* Schedule & Address Skeleton */}
          <div className="space-y-2 mb-4">
            <div className="h-4 bg-gray-700 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-gray-700 rounded w-4/5 animate-pulse"></div>
          </div>

          {/* Button Skeleton */}
          <div className="h-10 bg-gray-700 rounded w-36 animate-pulse"></div>
        </div>
      </div>
    </div>
  );

  const ShopDetailsSkeleton = () => (
    <div className="bg-gray-800 rounded-lg shadow-xl p-6">
      <div className="h-6 bg-gray-700 rounded w-1/2 mb-4 animate-pulse"></div>

      <div className="space-y-4">
        {/* Joined At Skeleton */}
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 bg-gray-700 rounded animate-pulse"></div>
          <div className="flex-1">
            <div className="h-3 bg-gray-700 rounded w-20 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-700 rounded w-32 animate-pulse"></div>
          </div>
        </div>

        {/* Website Skeleton */}
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 bg-gray-700 rounded animate-pulse"></div>
          <div className="flex-1">
            <div className="h-3 bg-gray-700 rounded w-20 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-700 rounded w-48 animate-pulse"></div>
          </div>
        </div>

        {/* Social Media Skeleton */}
        <div>
          <div className="h-3 bg-gray-700 rounded w-24 mb-3 animate-pulse"></div>
          <div className="flex items-center gap-4">
            <div className="w-6 h-6 bg-gray-700 rounded-full animate-pulse"></div>
            <div className="w-6 h-6 bg-gray-700 rounded-full animate-pulse"></div>
            <div className="w-6 h-6 bg-gray-700 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Back to Dashboard Button */}
      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={handleBackToDashboard}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors"
          aria-label="Back to dashboard"
          tabIndex={0}
        >
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>
      </div>

      {/* Banner Section */}
      <div className="relative h-[40vh] bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
        {/* Cover Image or Gradient */}
        {coverImage.startsWith("bg-") ? (
          <div className={`absolute inset-0 ${coverImage}`}></div>
        ) : (
          <img
            src={coverImage}
            alt="Cover"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black opacity-20"></div>

        {/* Edit Cover Button */}
        <div className="absolute top-6 right-6 z-20">
          <button
            onClick={handleChangeCover}
            className="flex items-center gap-2 bg-gray-800/80 hover:bg-gray-700/80 text-white px-4 py-2 rounded-lg shadow-lg transition-colors backdrop-blur-sm"
            aria-label="Change cover image"
            tabIndex={0}
          >
            <Camera size={20} />
            <span>Edit Cover</span>
          </button>
        </div>
      </div>

      {/* Cards Container */}
      <div className="max-w-7xl mx-auto px-6 -mt-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {isPending ? (
            <>
              {/* Show Skeleton Loaders when data is loading */}
              <ProfileCardSkeleton />
              <ShopDetailsSkeleton />
            </>
          ) : (
            <>
              {/* Card 1: Profile Information */}
              <div className="lg:col-span-2 bg-gray-800 rounded-lg shadow-xl p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <img
                      src={sellerProfile.avatar}
                      alt={sellerProfile.name}
                      className="w-32 h-32 rounded-full border-4 border-gray-700 bg-gray-700"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                          {sellerProfile.name}
                        </h1>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {sellerProfile.description}
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap items-center gap-6 mt-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Users size={18} className="text-blue-400" />
                        <span className="text-white font-medium">
                          {sellerProfile.followers}
                        </span>
                        <span className="text-gray-400 text-sm">Followers</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {renderStars(sellerProfile.rating)}
                      </div>
                    </div>

                    {/* Schedule & Address */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-start gap-2 text-gray-300">
                        <Clock
                          size={18}
                          className="mt-0.5 text-green-400 flex-shrink-0"
                        />
                        <span className="text-sm">
                          {sellerProfile.schedule}
                        </span>
                      </div>
                      <div className="flex items-start gap-2 text-gray-300">
                        <MapPin
                          size={18}
                          className="mt-0.5 text-red-400 flex-shrink-0"
                        />
                        <span className="text-sm">{sellerProfile.address}</span>
                      </div>
                    </div>

                    {/* Edit Button */}
                    <button
                      onClick={handleEditProfile}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                      aria-label="Edit profile"
                      tabIndex={0}
                    >
                      <Edit size={18} />
                      <span>Edit Profile</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 2: Shop Details */}
              <div className="bg-gray-800 rounded-lg shadow-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">
                  Shop Details
                </h2>

                <div className="space-y-4">
                  {/* Joined At */}
                  <div className="flex items-start gap-3">
                    <Calendar
                      size={20}
                      className="text-blue-400 flex-shrink-0 mt-0.5"
                    />
                    <div>
                      <p className="text-gray-400 text-sm">Joined At</p>
                      <p className="text-white font-medium">
                        {sellerProfile.joinedAt}
                      </p>
                    </div>
                  </div>

                  {/* Website */}
                  {sellerProfile.website && (
                    <div className="flex items-start gap-3">
                      <Globe
                        size={20}
                        className="text-green-400 flex-shrink-0 mt-0.5"
                      />
                      <div>
                        <p className="text-gray-400 text-sm">Website</p>
                        <a
                          href={sellerProfile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-500 font-medium break-all"
                          tabIndex={0}
                        >
                          {sellerProfile.website}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Social Media */}
                  <div>
                    <p className="text-gray-400 text-sm mb-3">Social Media</p>
                    <div className="flex items-center gap-4">
                      {socialMediaLinks.map(
                        (social) =>
                          social.url && (
                            <a
                              key={social.name}
                              href={social.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`${social.color} transition-colors`}
                              aria-label={social.name}
                              tabIndex={0}
                            >
                              <social.icon size={24} />
                            </a>
                          )
                      )}
                    </div>
                    {!socialMediaLinks.some((social) => social.url) && (
                      <p className="text-gray-500 text-sm">
                        No social media links
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Tabs Navigation */}
        <div className="bg-gray-800 rounded-t-lg shadow-xl">
          <div className="flex border-b border-gray-700">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === tab.id
                    ? "text-white bg-gray-700 border-b-2 border-blue-500"
                    : "text-gray-400 hover:text-white hover:bg-gray-750"
                }`}
                aria-label={`${tab.label} tab`}
                tabIndex={0}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-gray-800 rounded-b-lg shadow-xl p-6 mb-8">
          {renderTabContent()}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <EditProfileModal
          profile={sellerProfile}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveProfile}
        />
      )}

      {/* Banner Change Modal */}
      {isBannerModalOpen && (
        <BannerChangeModal
          currentBanner={coverImage}
          onClose={() => setIsBannerModalOpen(false)}
          onConfirm={handleBannerConfirm}
          onUpload={handleBannerUpload}
        />
      )}
    </div>
  );
};

export default Page;
