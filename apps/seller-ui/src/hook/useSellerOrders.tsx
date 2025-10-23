"use client";

import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/utils/axiosInstance";
import { isProtected } from "@/utils/protected";

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  selectedOptions: any;
}

export interface Order {
  id: string;
  userId: string;
  shopId: string;
  total: number;
  status: string;
  deliveryStatus: string | null;
  shippingAddressId: string | null;
  couponCode: string | null;
  discountAmount: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}

// Fetch seller orders from API
const fetchSellerOrders = async () => {
  const response = await axiosInstance.get(
    "order/api/get-seller-orders",
    isProtected
  );
  return response.data.orders as Order[];
};

const useSellerOrders = () => {
  const {
    data: orders,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["seller-orders"],
    queryFn: fetchSellerOrders,
    retry: 1,
    staleTime: 1000 * 60 * 2, // Data stays fresh for 2 minutes
  });

  return {
    orders: orders || [],
    isPending,
    isError,
    error,
  };
};

export default useSellerOrders;
