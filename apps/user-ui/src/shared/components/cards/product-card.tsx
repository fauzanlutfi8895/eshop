import Link from "next/link";
import React, { useEffect, useState } from "react";
import Ratings from "../ratings";
import { Eye, Heart, ShoppingBag } from "lucide-react";
import ProductDetailCard from "./product-detail.card";

const ProductCard = ({
  product,
  isEvent,
}: {
  product: any;
  isEvent?: boolean;
}) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isEvent && product?.ending_date) {
      const calculateTimeLeft = () => {
        const endTime = new Date(product.ending_date).getTime();
        const now = Date.now();
        const diff = endTime - now;

        if (diff <= 0) {
          setTimeLeft("Expired");
          return false;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        setTimeLeft(
          `${days}d ${hours}h ${minutes}m ${seconds}s left with this price`
        );
        return true;
      };

      // jalankan sekali saat mount
      calculateTimeLeft();

      // update tiap detik
      const interval = setInterval(() => {
        const stillActive = calculateTimeLeft();
        if (!stillActive) clearInterval(interval);
      }, 1000);

      return () => clearInterval(interval);
    }
    return;
  }, [isEvent, product?.ending_date]);

  return (
    <div className="w-full min-h-[350px] h-max bg-white rounded-lg relative">
      {isEvent && (
        <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-semibold px-2 py-1 rounded-sm shadow-md">
          OFFER
        </div>
      )}

      {product?.stock <= 5 && (
        <div className="absolute top-2 right-2 bg-yellow-400 text-slate-700 text-[10px] font-semibold px-2">
          Limited Stock
        </div>
      )}

      <Link href={`/product/${product?.slug}`} />
      <img
        src={
          product?.images[0]?.file_url ||
          "https://ik.imagekit.io/uxake262l/product/placeholder_product.png?updatedAt=1757921527526"
        }
        alt={product?.title}
        width={300}
        height={300}
        className="w-full h-[200px] object-cover rounded-t-md"
      />
      <Link
        href={`/shop/${product?.Shop?.id}`}
        className="block text-blue-500 text-sm font-medium my-2 px-2"
      >
        {product?.Shop?.name}
      </Link>
      <Link href={`/product/${product?.slug}`}>
        <h3 className="text-base font-semibold px-2 text-gray-800">
          {product?.title}
        </h3>
      </Link>
      <div className="mt-2 px-2">
        <Ratings rating={product?.ratings} />
      </div>
      <div className="mt-3 flex justify-between items-center px-2">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900">
            ${product?.sale_price}
          </span>
          <span className="text-sm line-through text-gray-400">
            ${product?.regular_price}
          </span>
        </div>
        <span className="text-green-500 text-sm font-medium">
          {product?.totalSales} sold
        </span>
      </div>
      {isEvent && timeLeft && (
        <div className="mt-2">
          <span className="inline-block text-xs bg-orange-100 text-orange-500">
            {timeLeft}
          </span>
        </div>
      )}
      <div className="absolute z-10 flex flex-col gap-3 right-3 top-10">
        <div className="bg-white rounded-full p-[-6px] shadow-md">
          <Heart
            className="cursor-pointer hover:scale-110 transition"
            size={22}
            fill="red"
            stroke="red"
          />
        </div>
        <div className="bg-white rounded-full p-[-6px] shadow-md">
          <Eye
            className="cursor-pointer text-[#4b5563] hover:scale-110 transition"
            size={22}
            onClick={() => setOpen(true)}
          />
        </div>
        <div className="bg-white rounded-full p-[-6px] shadow-md">
          <ShoppingBag
            className="cursor-pointer text-[#4b5563] hover:scale-110 transition"
            size={22}
          />
        </div>
      </div>
      {open && (
        <ProductDetailCard data={product} setOpen={setOpen}/>
      )}
    </div>
  );
};

export default ProductCard;
