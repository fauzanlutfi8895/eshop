"use client";

import dynamic from "next/dynamic";

const PaymentSuccessContent = dynamic(
  () =>
    import("./payment-success-content").then(
      (mod) => mod.PaymentSuccessContent
    ),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="bg-white shadow-lg border border-gray-100 rounded-2xl max-w-md w-full p-8 text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    ),
  }
);

export function PaymentSuccessWrapper() {
  return <PaymentSuccessContent />;
}
