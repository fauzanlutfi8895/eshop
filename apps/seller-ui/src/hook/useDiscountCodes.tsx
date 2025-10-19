"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../utils/axiosInstance";

// Types
interface DiscountCode {
  id: string;
  public_name: string;
  discountType: "percentage" | "flat";
  discountValue: number;
  discountCode: string;
}

interface CreateDiscountCodePayload {
  public_name: string;
  discountType: "percentage" | "flat";
  discountValue: number;
  discountCode: string;
}

// Fetch discount codes
const fetchDiscountCodes = async (): Promise<DiscountCode[]> => {
  const res = await axiosInstance.get("/product/api/get-discount-code");
  return res?.data?.discount_codes || [];
};

// Create discount code
const createDiscountCode = async (data: CreateDiscountCodePayload) => {
  await axiosInstance.post("/product/api/create-discount-code", data);
};

// Delete discount code
const deleteDiscountCode = async (discountId: string) => {
  await axiosInstance.delete(`product/api/delete-discount-code/${discountId}`);
};

// Main hook
const useDiscountCodes = () => {
  const queryClient = useQueryClient();

  // Query: Fetch discount codes
  const {
    data: discountCodes = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["shop-discounts"],
    queryFn: fetchDiscountCodes,
    // No need to specify staleTime/gcTime - already configured globally in provider.tsx
    // Provider has: 5 min staleTime + 24h gcTime + localStorage persistence
  });

  // Mutation: Create discount code
  const createMutation = useMutation({
    mutationFn: createDiscountCode,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["shop-discounts"],
      });
    },
  });

  // Mutation: Delete discount code
  const deleteMutation = useMutation({
    mutationFn: deleteDiscountCode,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["shop-discounts"],
      });
    },
  });

  return {
    // Data
    discountCodes,
    isLoading,
    isError,
    error,

    // Mutations
    createDiscountCode: createMutation.mutate,
    deleteDiscountCode: deleteMutation.mutate,

    // Mutation states
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.error,
    deleteError: deleteMutation.error,
  };
};

export default useDiscountCodes;
