"use client";

import dynamic from "next/dynamic";

const CheckoutContent = dynamic(
  () => import("./checkout-content").then((mod) => mod.CheckoutContent),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    ),
  }
);

export function CheckoutWrapper() {
  return <CheckoutContent />;
}
