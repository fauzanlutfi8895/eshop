"use client";

import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../utils/axiosInstance";
import { useAuthStore } from "../store/authStore";
import { isProtected } from "../utils/protected";
import { useEffect } from "react";

//fetch user data from API
const fetchUser = async () => {
  const respone = await axiosInstance.get("/api/logged-in-user", isProtected);
  return respone.data.user;
};

const useUser = () => {
  const { setLoggedIn } = useAuthStore();

  const {
    data: user,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["user"],
    queryFn: fetchUser,
    retry: false, //khusus login tidap perlu retry ulang
    // staleTime is now configured globally in provider.tsx (5 minutes)
    // gcTime is also configured globally (24 hours with localStorage persistence)
  });

  // Handle auth state based on query result
  useEffect(() => {
    if (user) {
      setLoggedIn(true);
    } else if (isError) {
      setLoggedIn(false);
    }
  }, [user, isError, setLoggedIn]);

  return { user: user as any, isLoading: isPending, isError };
};

export default useUser;
