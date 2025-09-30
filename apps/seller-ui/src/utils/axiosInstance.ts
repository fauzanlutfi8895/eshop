import axios from "axios";
import { runRedirectToLogin } from "./redirect";

//Custom Axios
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SERVER_URI,
  withCredentials: true,
});

//logic
let isRefreshing = false;
let refreshSubscribers: (() => void)[] = []; //stored all failed request, wait for new access

//Handle logout and prevent infinite loops
const handleLogout = () => {
  const publicPath = ["/login", "/signup", "/forgot-password"];
  const currentPath = window.location.pathname;

  if (!publicPath.includes(currentPath)) {
    runRedirectToLogin();
  }
};

//Handle adding a new access token to queued requests (when 401 happen)
const subscribeTokenRefresh = (callback: () => void) => {
  refreshSubscribers.push(callback);
};

//Execute queued requests after refresh
const onRefreshSuccess = () => {
  refreshSubscribers.forEach((callback) => callback()); //retry all waiting request
  refreshSubscribers = []; //empty
};

//Handling API requests (runs before every request)
axiosInstance.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

//Handling expired tokens and refresh logic
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const is401 = error?.response?.status === 401;
    const isRetry = originalRequest?._retry;
    const isAuthRequired = originalRequest?.requireAuth === true;
    //prevent infinite retry loop
    if (is401 && !isRetry && isAuthRequired) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh(() => resolve(axiosInstance(originalRequest)));
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post(
          `${process.env.NEXT_PUBLIC_SERVER_URI}/api/refresh-token`,
          {},
          { withCredentials: true }
        );

        isRefreshing = false;
        onRefreshSuccess();

        return axiosInstance(originalRequest);
      } catch (error) {
        isRefreshing = false;
        refreshSubscribers = [];
        handleLogout();
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
