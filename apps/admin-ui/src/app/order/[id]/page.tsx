"use client";

import { PRODUCT_IMAGE_PLACEHOLDER } from "apps/admin-ui/src/shared/constant";
import axiosInstance from "apps/admin-ui/src/utils/axiosInstance";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const status = [
  "Ordered",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

const Page = () => {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchOrder = async () => {
    try {
      const res = await axiosInstance.get(
        `/order/api/get-order-details/${orderId}`
      );
      setOrder(res.data.order);
    } catch (error) {
      setLoading(false);
      console.error("Failed to fetch order details: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
      <div className="my-4">
        <span
          className="text-white flex items-center gap-2 font-semibold cursor-pointer"
          onClick={() => router.push("/dashboard/orders")}
        >
          <ArrowLeft /> Go back to Dashboard
        </span>
      </div>

      <h1 className="text-2xl font-bold text-gray-200 mb-4">
        Order #{order.id.slice(-6)}
      </h1>

      {/* Delivery Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs font-medium text-gray-500">
          {status.map((step, idx) => {
            const current = step === order.deliveryStatus;
            const passed = status.indexOf(order.deliveryStatus) >= idx;
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
        {/*  */}
        <div className="flex items-center">
          {status.map((step, idx) => {
            const reached = idx <= status.indexOf(order.deliveryStatus);
            return (
              <div key={step} className="flex-1 flex items-center">
                {/* Bulatan */}
                <div
                  className={`w-4 h-4 rounded-full ${
                    reached ? "bg-blue-600" : "bg-gray-300"
                  }`}
                />
                {/* Garis */}
                {idx < status.length - 1 && (
                  <div
                    className={`flex-1 h-1 ${
                      reached ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summery Info */}
      <div className="mb-6 space-y-1 text-sm text-gray-200">
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
            <span className="font-semibold">Discount Applied:</span>{" "}
            <span className="text-green-400">
              -${order.discountAmount.toFixed(2)} (
              {order.couponCode?.discountType === "percentage"
                ? `${order.couponCode.discountValue}`
                : `$${order.couponCode.discountValue}`}{" "}
              off )
            </span>
          </p>
        )}

        {order.couponCode && (
          <p>
            <span className="font-semibold">Coupon Used: </span>{" "}
            <span className="text-blue-400">
              ${order.couponCode.public_name}
            </span>
          </p>
        )}

        <p>
          <span className="font-semibold">Date: </span>{" "}
          {new Date(order.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Shipping Address */}
      {order.shippingAddress && (
        <div className="mb-6 text-sm text-gray-300">
          <h2 className="font-semibold mb-2">Shipping Address</h2>
          <p>{order.shippingAddress.name}</p>
          <p>
            {order.shippingAddress.street}, {order.shippingAddress.city},{" "}
            {order.shippingAddress.zip}
          </p>
          <p>{order.shippingAddress.country}</p>
        </div>
      )}

      {/* Order Items */}
      <div>
        <h2 className="text-lg font-semibold text-gray-300 mb-4">
          Order Items
        </h2>
        <div className="space-y-4">
          {order.items.map((item: any) => (
            <div
              key={item.productId}
              className="border border-gray-700 rounded-md flex items-center gap-4 p-3 bg-gray-900"
            >
              {/* Gambar Produk */}
              <img
                src={
                  item.product?.images[0]?.file_url || PRODUCT_IMAGE_PLACEHOLDER
                }
                alt={item?.product?.title || "Product Image"}
                className="w-20 h-20 object-cover rounded-md border border-gray-700"
              />

              {/* Info Produk */}
              <div className="flex-1">
                <p className="font-semibold text-gray-200 text-base">
                  {item?.product?.title || "Unnamed Product"}
                </p>

                {/* Quantity */}
                <p className="text-sm text-gray-400">
                  Quantity: {item.quantity}
                </p>

                {/* Selected Options */}
                <div className="flex flex-wrap gap-2 mt-1">
                  {item.selectedOptions &&
                    Object.entries(item.selectedOptions).map(
                      ([key, value]: [string, any]) => (
                        <span
                          key={key}
                          className="px-2 py-1 bg-gray-800 border border-gray-700 rounded-md text-xs text-gray-300 flex items-center justify-center"
                        >
                          {key}: {value}
                          {key === "color" && (
                            <span
                              className="ml-2 inline-block w-4 h-4 rounded-full mr-1"
                              style={{ backgroundColor: value }}
                            />
                          )}
                        </span>
                      )
                    )}
                </div>
              </div>

              {/* Harga item */}
              <div className="text-gray-300 font-medium mr-3">
                ${(item.price * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Page;
