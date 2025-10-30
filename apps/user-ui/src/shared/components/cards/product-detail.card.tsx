import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import Ratings from "../ratings";
import { Heart, MapPin, ShoppingCartIcon, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store";
import useLocationTracking from "@/hooks/useLocationTracking";
import useDeviceTracking from "@/hooks/useDeviceTracking";
import useUser from "@/hooks/useUser";
import {
  PRODUCT_IMAGE_PLACEHOLDER,
  SHOP_IMAGE_PLACEHOLDER,
} from "../../constant";
import axiosInstance from "@/utils/axiosInstance";
import { isProtected } from "@/utils/protected";

const ProductDetailCard = ({
  data,
  setOpen,
}: {
  data: any;
  setOpen: (open: boolean) => void;
}) => {
  const [activeImage, setActiveImage] = useState(0);
  const [isSelected, setIsSelected] = useState(data?.colors?.[0] || "");
  const [isSizeSelected, setIsSizeSelected] = useState(data?.sizes?.[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user } = useUser();
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();

  //UseStore zustand cart & wishlist
  const addToCart = useStore((state: any) => state.addToCart);
  const addToWishlist = useStore((state: any) => state.addToWishlist);
  const removeFromWishlist = useStore((state: any) => state.removeFromWishlist);
  const wishlist = useStore((state: any) => state.wishlist);
  const isWishlisted = wishlist.some((item: any) => item.id === data?.id);
  const cart = useStore((state: any) => state.cart);
  const isInCart = cart.some((item: any) => item.id === data?.id);

  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

  const handleChat = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const res = await axiosInstance.post(
        "/chatting/api/create-user-conversationGroup",
        { sellerId: data?.Shop?.sellerId },
        isProtected
      );
      router.push(`/inbox?conversationId=${res.data.conversation.id}`);
    } catch (error) {
      console.log("Something error with chat feature: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-[90%] md:w-[70%] h-auto max-h-[90vh] bg-white shadow-2xl rounded-2xl overflow-y-auto transition-all transform scale-100 hover:scale-[1.01]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col md:flex-row gap-6 p-6">
          {/* LEFT: Product Image & Thumbnails */}
          <div className="w-full md:w-1/2 flex flex-col items-center">
            <div className="w-full aspect-square bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
              <Image
                src={
                  data?.images?.[activeImage]?.file_url ||
                  PRODUCT_IMAGE_PLACEHOLDER
                }
                alt={data?.title || "Product"}
                width={500}
                height={500}
                className="object-contain w-full h-full"
              />
            </div>

            {/* Thumbnails */}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {data?.images?.map((img: any, index: number) => (
                <button
                  key={index}
                  className={`w-16 h-16 rounded-md overflow-hidden border-2 transition ${
                    activeImage === index
                      ? "border-blue-500"
                      : "border-transparent hover:border-gray-300"
                  }`}
                  onClick={() => setActiveImage(index)}
                >
                  <Image
                    src={img?.file_url}
                    alt={`Thumbnail ${index}`}
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: Product Info */}
          <div className="w-full md:w-1/2 flex flex-col justify-between">
            {/* Header (Shop Info + Close Button) */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <Image
                  src={data?.Shop?.avatar || SHOP_IMAGE_PLACEHOLDER}
                  alt="Shop Logo"
                  width={50}
                  height={50}
                  className="rounded-full object-cover"
                />
                <div>
                  <Link
                    href={`/shop/${data?.Shop?.id}`}
                    className="text-lg font-semibold hover:text-blue-600 transition"
                  >
                    {data?.Shop?.name}
                  </Link>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <MapPin size={16} />{" "}
                    <span>{data?.Shop?.address || "No Address"}</span>
                  </div>
                  <Ratings rating={data?.Shop?.ratings} />
                </div>
              </div>

              <button
                className="text-gray-600 hover:text-gray-900 transition"
                onClick={() => setOpen(false)}
              >
                <X size={28} />
              </button>
            </div>

            {/* Product Title */}
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {data?.title}
            </h2>
            <p className="text-gray-700 mb-4 whitespace-pre-wrap">
              {data?.short_description}
            </p>

            {/* Color Options */}
            {data?.colors?.length > 0 && (
              <div className="mb-4">
                <strong className="block mb-1">Color:</strong>
                <div className="flex gap-2">
                  {data?.colors.map((color: string, i: number) => (
                    <button
                      key={i}
                      style={{ backgroundColor: color }}
                      className={`w-8 h-8 rounded-full border-2 transition ${
                        isSelected === color
                          ? "border-gray-500 scale-110 shadow-md"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                      onClick={() => setIsSelected(color)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size Options */}
            {data?.sizes?.length > 0 && (
              <div className="mb-4">
                <strong className="block mb-1">Size:</strong>
                <div className="flex gap-2 flex-wrap">
                  {data?.sizes.map((size: string, i: number) => (
                    <button
                      key={i}
                      className={`px-4 py-1 rounded-md border text-sm transition ${
                        isSizeSelected === size
                          ? "bg-gray-800 text-white border-gray-800"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                      }`}
                      onClick={() => setIsSizeSelected(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-3xl font-semibold text-blue-700">
                ${data?.sale_price}
              </span>
              {data?.regular_price && (
                <span className="text-lg line-through text-gray-400">
                  ${data?.regular_price}
                </span>
              )}
            </div>

            {/* Quantity + Add to Cart */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden">
                <button
                  className="px-3 py-2 text-lg hover:bg-gray-200"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  −
                </button>
                <span className="px-4 text-lg">{quantity}</span>
                <button
                  className="px-3 py-2 text-lg hover:bg-gray-200"
                  onClick={() => setQuantity((q) => q + 1)}
                >
                  +
                </button>
              </div>

              <button
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition ${
                  isInCart
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-orange-500 hover:bg-orange-600 text-white"
                }`}
                disabled={isInCart}
                onClick={() =>
                  !isInCart &&
                  addToCart(
                    {
                      ...data,
                      quantity,
                      selectedOptions: {
                        color: isSelected,
                        size: isSizeSelected,
                      },
                    },
                    user,
                    location,
                    deviceInfo
                  )
                }
              >
                <ShoppingCartIcon size={18} /> Add to Cart
              </button>

              <button
                className="p-2 hover:scale-110 transition"
                onClick={() =>
                  isWishlisted
                    ? removeFromWishlist(data.id, user, location, deviceInfo)
                    : addToWishlist(
                        { ...data, quantity: 1 },
                        user,
                        location,
                        deviceInfo
                      )
                }
              >
                <Heart
                  size={28}
                  fill={isWishlisted ? "red" : "transparent"}
                  stroke={isWishlisted ? "red" : "black"}
                />
              </button>
            </div>

            {/* Stock & Delivery */}
            <div className="text-sm text-gray-600 space-y-1">
              <div>
                Stock:{" "}
                <span
                  className={`font-semibold ${
                    data?.stock > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {data?.stock > 0 ? "In Stock" : "Out of Stock"}
                </span>
              </div>
              <div>
                Estimated Delivery:{" "}
                <strong>{estimatedDelivery.toDateString()}</strong>
              </div>
            </div>

            {/* Chat Button */}
            <div className="mt-6 flex justify-end">
              <button
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                onClick={() => handleChat()}
                disabled={isLoading}
              >
                💬 Chat with Seller
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailCard;
