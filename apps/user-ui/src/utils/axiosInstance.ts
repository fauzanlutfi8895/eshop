import axios, { InternalAxiosRequestConfig } from "axios";
import { runRedirectToLogin } from "./redirect";
import { CustomAxiosRequestConfig } from "./axiosInstance.types";

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

  console.log("handleLogout called:", {
    currentPath,
    isPublicPath: publicPath.includes(currentPath),
    willRedirect: !publicPath.includes(currentPath),
  });

  // Clear any cached user data from localStorage/sessionStorage
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (e) {
    console.error("Error clearing storage:", e);
  }

  if (!publicPath.includes(currentPath)) {
    console.log("Calling runRedirectToLogin()");
    runRedirectToLogin();
  } else {
    console.log("Already on public path, skipping redirect");
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
  (config: InternalAxiosRequestConfig & CustomAxiosRequestConfig) => {
    console.log("Request config:", {
      url: config.url,
      requireAuth: config.requireAuth,
    });
    return config;
  },
  (error) => Promise.reject(error)
);

//Handling expired tokens and refresh logic
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    const statusCode = error?.response?.status;
    const is401 = statusCode === 401;
    const is429 = statusCode === 429;
    const isRetry = originalRequest?._retry;
    const isAuthRequired = originalRequest?.requireAuth === true;

    // Debug: Log errors
    if (statusCode) {
      console.log(`Got ${statusCode} error:`, {
        url: originalRequest?.url,
        requireAuth: originalRequest?.requireAuth,
        isAuthRequired,
        isRetry,
      });
    }

    // Handle 429 (Too Many Requests) - stop immediately
    if (is429) {
      console.error("Too many requests! Server is rate limiting.");
      return Promise.reject(error);
    }

    //prevent infinite retry loop
    if (is401 && !isRetry) {
      console.log("Entering 401 handler block");
      // If this is a protected route, try to refresh the token
      if (isAuthRequired) {
        console.log("Auth is required, attempting token refresh");
        if (isRefreshing) {
          console.log("Already refreshing, queuing request");
          return new Promise((resolve) => {
            subscribeTokenRefresh(() =>
              resolve(axiosInstance(originalRequest))
            );
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          console.log("Calling refresh token API");
          await axios.post(
            `${process.env.NEXT_PUBLIC_SERVER_URI}/api/refresh-token`,
            {},
            { withCredentials: true }
          );

          console.log("Token refresh successful");
          isRefreshing = false;
          onRefreshSuccess();

          return axiosInstance(originalRequest);
        } catch (error) {
          console.log("Token refresh failed, calling handleLogout");
          isRefreshing = false;
          refreshSubscribers = [];
          handleLogout();
          return Promise.reject(error);
        }
      } else {
        // 401 on unprotected route or requireAuth not set - still logout
        console.log(
          "Auth not required or not set, calling handleLogout directly"
        );
        handleLogout();
        return Promise.reject(error);
      }
    } else if (is401 && isRetry) {
      // If we already retried after token refresh and still got 401, logout
      console.log(
        "Still 401 after retry, refresh token must be invalid, calling handleLogout"
      );
      handleLogout();
      return Promise.reject(error);
    }

    console.log("Not handling 401 - either not 401 or already retried");
    return Promise.reject(error);
  }
);

export default axiosInstance;
