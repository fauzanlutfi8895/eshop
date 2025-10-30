"use client";

import { Shop } from "@prisma/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  XIcon,
  Calendar,
  Clock,
  Globe,
  Heart,
  MapPin,
  Star,
  Users,
} from "lucide-react";
import Youtube from "@/assets/svgs/youtube";
import axiosInstance from "@/utils/axiosInstance";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import ProductCard from "@/shared/components/cards/product-card";
import useLocationTracking from "@/hooks/useLocationTracking";
import useDeviceTracking from "@/hooks/useDeviceTracking";
import useUser from "@/hooks/useUser";
import { sendKafkaEvent } from "@/actions/track-user";
import {
  AVATAR_IMAGE_PLACEHOLDER,
  SHOP_IMAGE_PLACEHOLDER,
} from "@/shared/constant";

const TABS = ["Products", "Offers", "Reviews"];

const SellerProfile = ({
  shop,
  followersCount,
}: {
  shop: Shop;
  followersCount: number;
}) => {
  const [activeTab, setActiveTab] = useState<string>("Products");
  const [followers, setFollowers] = useState<number>(followersCount);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);

  const { user } = useUser();
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ["seller-products", shop.id],
    queryFn: async () => {
      const res = await axiosInstance.get(
        `/seller/api/get-seller-products/${shop?.id}?page=1&limit=10`
      );
      return res.data.products;
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: events, isLoading: isEventsLoading } = useQuery({
    queryKey: ["seller-events"],
    queryFn: async () => {
      const res = await axiosInstance.get(
        `/seller/api/get-seller-events/${shop?.id}?page=1&limit=10`
      );
      return res.data.products ?? [];
    },
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    const fetchFollowers = async () => {
      if (!shop?.id) return;
      try {
        const res = await axiosInstance.get(
          `/seller/api/is-following/${shop?.id}`
        );
        setIsFollowing(res.data.isFollowing);
      } catch (error) {
        console.error("Error fetching followers:", error);
      }
    };
    fetchFollowers();
  }, [shop?.id]);

  const toggleFollowMutation = useMutation({
    mutationFn: async () => {
      const endpoint = isFollowing
        ? "/seller/api/unfollow-shop"
        : "/seller/api/follow-shop";

      const res = await axiosInstance.post(endpoint, { shopId: shop?.id });
      return res.data;
    },
    onSuccess: () => {
      setFollowers((prev) => (isFollowing ? prev - 1 : prev + 1));
      setIsFollowing((prev) => !prev);
      queryClient.invalidateQueries({ queryKey: ["is-following", shop.id] });
    },
    onError: (error: any) => {
      console.error("Follow/unfollow failed:", error);
    },
  });

  useEffect(() => {
    if (!isLoading && location && deviceInfo && user?.id) {
      sendKafkaEvent({
        userId: user?.id,
        shopId: shop?.id,
        action: "shop_visit",
        country: location?.country || "Unknown",
        city: location?.city || "Unknown",
        device: deviceInfo || "Unknown device",
      });
    }
  }, [location, deviceInfo, isLoading]);

  return (
    <div className="flex flex-col">
      {/* Banner */}
      <div className="relative w-full h-[300px]">
        <Image
          src={shop?.coverBanner || SHOP_IMAGE_PLACEHOLDER}
          alt="Seller Cover"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      {/* Profile Header */}
      <div className="max-w-6xl mx-auto px-6 md:px-8 relative mt-[-60px] z-10">
        <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col md:flex-row gap-6 items-center md:items-start">
          {/* Avatar */}
          <div className="relative w-[120px] h-[120px] rounded-full border-4 border-white shadow-lg overflow-hidden">
            <Image
              src={shop?.avatar || AVATAR_IMAGE_PLACEHOLDER}
              alt="Shop Avatar"
              fill
              className="object-cover"
            />
          </div>

          {/* Info */}
          <div className="flex-1 w-full md:pl-4">
            <h1 className="text-3xl font-semibold text-slate-900">
              {shop?.name || "Shop Name"}
            </h1>
            <p className="text-slate-600 mt-2 max-w-2xl">
              {shop?.bio || "No bio available for this shop."}
            </p>

            <div className="flex flex-wrap gap-4 mt-4 text-slate-700 text-sm">
              <div className="flex items-center gap-1">
                <Star className="text-yellow-400" size={18} />
                <span>{shop?.rating || "N/A"}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users size={18} />
                <span>
                  {followers ? `${followers} Followers` : "No Followers"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={18} />
                <span>{shop?.opening_hours || "Mon - Sat: 9 AM - 6 PM"}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin size={18} />
                <span>{shop?.address || "No address provided"}</span>
              </div>
            </div>
          </div>

          {/* Follow + Details */}
          <div className="flex flex-col items-end w-full md:w-[30%] gap-3">
            <button
              className={`px-6 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition text-white shadow-md ${
                isFollowing
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
              onClick={() => toggleFollowMutation.mutate()}
              disabled={toggleFollowMutation.isPending}
            >
              <Heart size={18} />
              {isFollowing ? "Unfollow" : "Follow"}
            </button>

            <div className="text-sm text-slate-700 space-y-2">
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>
                  Joined: {new Date(shop?.createdAt!).toLocaleDateString()}
                </span>
              </div>

              {shop?.website && (
                <div className="flex items-center gap-2">
                  <Globe size={16} />
                  <Link
                    href={shop.website}
                    className="text-blue-600 hover:underline"
                    target="_blank"
                  >
                    {shop.website}
                  </Link>
                </div>
              )}

              {shop?.socialLink?.length > 0 && (
                <div className="flex gap-3 mt-1">
                  {shop.socialLink.map((link: any, i: number) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:opacity-80"
                    >
                      {link.type === "youtube" && <Youtube />}
                      {link.type === "x" && <XIcon />}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto mt-10 px-6 md:px-8">
        <div className="flex border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-6 font-medium text-sm md:text-base transition-all ${
                activeTab === tab
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
          {activeTab === "Products" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {isLoading &&
                Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[250px] bg-gray-200 animate-pulse rounded-xl"
                  ></div>
                ))}
              {products?.map((p: any) => (
                <ProductCard key={p.id} product={p} />
              ))}
              {products?.length === 0 && (
                <p className="col-span-full text-center text-slate-500">
                  No products available.
                </p>
              )}
            </div>
          )}

          {activeTab === "Offers" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {isEventsLoading &&
                Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[250px] bg-gray-200 animate-pulse rounded-xl"
                  ></div>
                ))}
              {events?.map((e: any) => (
                <ProductCard key={e.id} product={e} isEvent />
              ))}
              {events?.length === 0 && (
                <p className="col-span-full text-center text-slate-500">
                  No offers available.
                </p>
              )}
            </div>
          )}

          {activeTab === "Reviews" && (
            <div className="text-center text-slate-500 py-10">
              No reviews yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerProfile;
