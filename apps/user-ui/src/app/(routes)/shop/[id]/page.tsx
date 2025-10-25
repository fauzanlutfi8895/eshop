import React from "react";
import axiosInstance from "@/utils/axiosInstance";
import { Metadata } from "next";
import { SHOP_IMAGE_PLACEHOLDER } from "@/shared/constant";
import SellerProfile from "@/shared/modules/seller/seller-profile";
async function fetchSellerDetails(id: string) {
  const response = await axiosInstance.get(`/seller/api/get-seller/${id}`);
  return response.data;
}

// Dynamic Metadata Generator
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await fetchSellerDetails(id);
  return {
    title: `${data?.shop?.name} | UniLoop Marketplace`,

    description: data?.shop?.bio || "Explore the best products from this shop",
    openGraph: {
      title: data?.shop?.name,
      description:
        data?.shop?.bio || "Explore the best products from this shop",
      images: [
        {
          url: data?.shop?.avatar || SHOP_IMAGE_PLACEHOLDER,
          width: 600,
          height: 800,
          alt: data?.shop?.name || "Shop Logo",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: data?.shop?.name,
      description: data?.shop?.bio || "Explore the best products from this shop",
      images: [
        {
          url: data?.shop?.avatar || SHOP_IMAGE_PLACEHOLDER,
          width: 600,
          height: 800,
          alt: data?.shop?.name || "Shop Logo",
        },
      ],
    },
  };
}

const Page = async ({ params }: { params: { id: string } }) => {
    const data = await fetchSellerDetails(params.id);
    return (
      <div>
        <SellerProfile shop={data?.shop} followersCount={data?.followersCount} />
      </div>
    );
};

export default Page;
