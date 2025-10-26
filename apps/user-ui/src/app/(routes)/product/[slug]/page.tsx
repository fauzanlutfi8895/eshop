import ProductDetails from "@/shared/modules/product/product-details";
import axiosInstance from "@/utils/axiosInstance";
import { Metadata } from "next";
import React from "react";

async function fetchProductDetails(slug: string) {
  const respons = await axiosInstance.get(`/product/api/get-product/${slug}`);
  return respons.data.product;
}

//penting untuk SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductDetails(slug);
  return {
    title: `${product?.title} | UniLoop`,
    keywords: [
      ...(product?.tags || []),
      "UniLoop",
      "marketplace",
      product?.title,
      "belanja online",
    ],
    description:
      product?.short_description ||
      "Discover high-quality on Eshop Marketplace.",
    openGraph: {
      title: product?.title,
      description: product?.short_description || "",
      images: [product?.images[0]?.file_url || "/default-image.jpg"],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product?.title,
      description: product?.short_description || "",
      images: [product?.images[0]?.file_url || "/default-image.jpg"],
    },
  };
}

const Page = async (props: { params: Promise<{ slug: string }> }) => {
  // fetching di server lebih SEO friendly
  const { slug } = await props.params;
  const productDetails = await fetchProductDetails(slug);
  return <ProductDetails productDetails={productDetails} />;
};

export default Page;
