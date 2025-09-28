"use client";

import React, { useEffect } from "react";
import { CheckCircle, Truck } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useStore } from "apps/user-ui/src/store";
import confetti from "canvas-confetti";

const PaymentSuccessPage = () => {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const router = useRouter();

  //clear cart
  useEffect(() => {
    useStore.setState({ cart: [] });

    confetti({
      particleCount: 40,
      spread: 120,
      origin: { y: 0.6 },
    });
  }, []);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="bg-white shadow-lg border border-gray-100 rounded-2xl max-w-md w-full p-8 text-center">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Payment Successful
        </h2>

        {/* Subtitle */}
        <p className="text-sm text-gray-600 mb-6">
          Thank you for your purchase. <br />
          Your order has been placed successfully!
        </p>

        {/* Action Button */}
        <button
          onClick={() => router.push(`/profile?active=My+Orders`)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition"
        >
          <Truck className="w-4 h-4" />
          Track Order
        </button>

        {/* Session ID */}
        <div className="mt-6 text-xs text-gray-400">
          Payment Session ID:{" "}
          <span className="font-mono text-gray-600">{sessionId}</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
