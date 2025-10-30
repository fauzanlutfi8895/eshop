"use client";

import { PRODUCT_IMAGE_PLACEHOLDER } from "@/shared/constant";
import axiosInstance from "@/utils/axiosInstance";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

const Page = () => {
  const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await axiosInstance.get(
          `/order/api/get-order-details/${orderId}`
        );
        setOrder(res.data.order);
      } catch (error) {
        console.error("Failed to fetch order details: ", error);
      }
    };
    if (orderId) fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[40vh]">
        <Loader2 className="animate-spin w-6 h-6 text-gray-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <p className="text-center text-sm text-red-500">Order not found...</p>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Order #{order.id.slice(-6)}
      </h1>
      {/* Delivery Progress */}
      <div className="my-4">
        <div className="flex items-center justify-between text-xs font-medium text-gray-500">
          {[
            "Ordered",
            "Packed",
            "Shipped",
            "Out for Delivery",
            "Delivered",
          ].map((step, idx) => {
            const current =
              step.toLowerCase() ===
              (order.deliveryStatus || "processing").toLowerCase();
            const passed =
              idx <=
              [
                "Ordered",
                "Packed",
                "Shipped",
                "Out for Delivery",
                "Delivered",
              ].findIndex(
                (s) =>
                  s.toLowerCase() ===
                  (order.deliveryStatus || "processing").toLowerCase()
              );
            return (
              <div
                key={step}
                className={`flex-1 text-left ${
                  current
                    ? "text-blue-600"
                    : passed
                    ? "text-green-600"
                    : "text-gray-400"
                }`}
              >
                {step}
              </div>
            );
          })}
        </div>
        <div className="flex items-center">
          {[
            "Ordered",
            "Packed",
            "Shipped",
            "Out for Delivery",
            "Delivered",
          ].map((step, idx) => {
            const isReached =
              idx <=
              [
                "Ordered",
                "Packed",
                "Shipped",
                "Out for Delivery",
                "Delivered",
              ].findIndex(
                (s) =>
                  s.toLowerCase() ===
                  (order.deliveryStatus || "processing").toLowerCase()
              );
            return (
              <div key={step} className="flex-1 flex items-center">
                <div
                  className={`w-4 h-4 rounded-full ${
                    isReached ? "bg-blue-600" : "bg-gray-300"
                  }`}
                />
                {idx !== 4 && (
                  <div
                    className={`flex-1 h-1 ${
                      isReached ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
      {/* Summary Info */}
      <div className="mb-6 space-y-1 text-sm text-gray-700">
        <p>
          <span className="font-semibold">Payment Status: </span>{" "}
          <span className="text-green-600">{order.status}</span>
        </p>
        <p>
          <span className="font-semibold">Total: </span>{" "}
          <span className="font-medium">${order.total.toFixed(2)}</span>
        </p>
        {order.discountAmount > 0 && (
          <p>
            <span className="font-semibold">Discount Applied: </span>{" "}
            <span className="text-green-700">
              -${order.discountAmount.toFixed(2)} (
              {order.couponCode?.discountType === "percentage"
                ? `${order.couponCode.discountValue}%`
                : `$${order.couponCode.discountValue}`}{" "}
              off )
            </span>
          </p>
        )}
        {order.couponCode && (
          <p>
            <span className="font-semibold">Coupon Used: </span>{" "}
            <span className="text-blue-600">
              {order.couponCode.public_name}
            </span>
          </p>
        )}
        <p>
          <span className="font-semibold">Date: </span>{" "}
          {new Date(order.createdAt).toLocaleDateString()}
        </p>
      </div>
      {/* Shipping Info */}
      {order.shippingAddress && (
        <div className="mb-6 text-sm text-gray-700">
          <h2 className="font-semibold mb-2">Shipping Address</h2>
          <p>{order.shippingAddress.name}</p>
          <p>{order.shippingAddress.street}</p>
          <p>{order.shippingAddress.city}</p>
          <p>{order.shippingAddress.zip}</p>
        </div>
      )}
      {/* Order Items */}
      <div className="mb-6 text-sm text-gray-700">
        <h2 className="font-semibold mb-2">Order Items</h2>
        <div className="space-y-4">
          {order.items.map((item: any) => (
            <div
              key={item.id}
              className="border border-gray-400 rounded-md flex items-center gap-4 p-4"
            >
              <img
                src={
                  item.product.images[0].file_url || PRODUCT_IMAGE_PLACEHOLDER
                }
                alt={item.product.title || "Product Image"}
                className="w-16 h-16 object-cover rounded-md border border-gray-700"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-800">
                  {item.product.title || "Unnamed Product"}
                </p>
                <p className="text-sm text-gray-600">
                  Quantity: {item.quantity}
                </p>
                {item.selectedOptions && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Object.entries(item.selectedOptions).map(
                      ([key, value]) => (
                        <span
                          key={key}
                          className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-md flex items-center gap-2"
                        >
                          {key}:{" "}
                          {typeof value === "string"
                            ? value
                            : JSON.stringify(value)}
                          {key === "color" && (
                            <span
                              className="inline-block w-3 h-3 rounded-full border border-gray-800"  
                              style={{ backgroundColor: value as string }}
                            />
                          )}
                        </span>
                      )
                    )}
                  </div>
                )}
              </div>
              <p className="text-sm font-semibold text-gray-800">
                ${item.price.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Page;
