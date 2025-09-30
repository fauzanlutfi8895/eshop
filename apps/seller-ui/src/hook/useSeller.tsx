"use client";

import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../utils/axiosInstance";
import { isProtected } from "../utils/protected";
import { useAuthStore } from "../store/authStore";

//fetch user data from API
const fetchSeller = async (isLoggedIn: boolean) => {
  const config = isLoggedIn ? isProtected : {};
  const respone = await axiosInstance.get("/api/logged-in-seller", config);
  return respone.data.seller;
};

const useSeller = () => {
  const { isLoggedIn, setLoggedIn } = useAuthStore();
  const {
    data: seller,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["seller"],
    queryFn: () => fetchSeller(isLoggedIn),
    staleTime: 1000 * 60 * 5,
    retry: false,
    //@ts-ignore
    onSuccess: () => {
      setLoggedIn(true);
    },
    onError: () => {
      setLoggedIn(false);
    },
  });

  return { seller: seller as any, isPending, isError };
};

export default useSeller;
