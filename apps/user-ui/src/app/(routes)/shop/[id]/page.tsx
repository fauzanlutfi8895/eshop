import React from "react";
import axiosInstance from "@/utils/axiosInstance";
import { Metadata } from "next";
import { SHOP_IMAGE_PLACEHOLDER } from "@/shared/constant";
import SellerProfile from "@/shared/modules/seller/seller-profile";
async function fetchSellerDetails(id: string) {
  const response = await axiosInstance.get(`/seller/api/get-seller/${id}`);
  return response.data.seller;
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
    title: `${data?.name} | UniLoop Marketplace`,

    description: data?.bio || "Explore the best products from this shop",
    openGraph: {
      title: data?.name,
      description:
        data?.bio || "Explore the best products from this shop",
      images: [
        {
          url: data?.avatar || SHOP_IMAGE_PLACEHOLDER,
          width: 600,
          height: 800,
          alt: data?.name || "Shop Logo",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: data?.name,
      description:
        data?.bio || "Explore the best products from this shop",
      images: [
        {
          url: data?.avatar || SHOP_IMAGE_PLACEHOLDER,
          width: 600,
          height: 800,
          alt: data?.name || "Shop Logo",
        },
      ],
    },
  };
}

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const { id } = await props.params;
  const data = await fetchSellerDetails(id);
  return (
    <div>
      {/* <h1>Berhasil masuk shop A</h1> */}
      <SellerProfile shop={data} followersCount={data?.followers.length} />
    </div>
  );
};

export default Page;
