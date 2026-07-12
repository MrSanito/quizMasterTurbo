import axios from "axios";
import { createDpopProof } from "./deviceKey";

export const isAxiosError = axios.isAxiosError;

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if the error is 401 (Unauthorized) and the request has not been retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // If the request was to the refresh or verification endpoint itself, do not retry
      if (
        originalRequest.url?.includes("/auth2/refresh") || 
        originalRequest.url?.includes("/auth2/verifyLoginOTP") ||
        originalRequest.url?.includes("/auth/verify_token")
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        let headers = {};
        try {
          const refreshUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth2/refresh`;
          const dpopProof = await createDpopProof(refreshUrl, "POST");
          headers = { "dpop-proof": dpopProof };
        } catch (dpopErr) {
          console.warn("Could not create DPoP proof for interceptor refresh:", dpopErr);
        }

        // Silent token rotation refresh call
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth2/refresh`,
          {},
          { withCredentials: true, headers }
        );

        isRefreshing = false;
        processQueue(null);

        // Retry original failed request
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
