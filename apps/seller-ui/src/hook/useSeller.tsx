"use client";

import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/utils/axiosInstance";
import { isProtected } from "@/utils/protected";
import { useAuthStore } from "@/store/authStore";
import { useEffect } from "react";

//fetch user data from API
const fetchSeller = async () => {
  const respone = await axiosInstance.get("/api/logged-in-seller", isProtected);
  return respone.data.seller;
};

const useSeller = () => {
  const { setLoggedIn } = useAuthStore();
  const {
    data: seller,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["seller"],
    queryFn: fetchSeller,
    retry: false,
    // staleTime is now configured globally in provider.tsx (5 minutes)
    // gcTime is also configured globally (24 hours with localStorage persistence)
  });

  // Handle auth state based on query result
  useEffect(() => {
    if (seller) {
      setLoggedIn(true);
    } else if (isError) {
      setLoggedIn(false);
    }
  }, [seller, isError, setLoggedIn]);

  return { seller: seller as any, isPending, isError };
};

export default useSeller;
