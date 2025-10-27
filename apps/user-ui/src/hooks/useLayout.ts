import axiosInstance from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";

// Fetch layout data from API
const fetchLayout = async () => {
  const response = await axiosInstance.get("/api/get-layout");
  return response.data.layout;
};

const useLayout = () => {
  const {
    data: layout,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["layout"],
    queryFn: fetchLayout,
    staleTime: 60 * 60 * 1000, // 10 minutes
    retry: 1,
  });
  return { layout, isLoading, isError, refetch };
};

export default useLayout;
