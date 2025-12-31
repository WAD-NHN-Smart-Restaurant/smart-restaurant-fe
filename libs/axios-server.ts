import axios from "axios";
import { cookies } from "next/headers";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const TIMEOUT = 30 * 60 * 1000;
const ACCESS_TOKEN_KEY = "access_token";
const UNAUTHORIZED_STATUS = 401;

const axiosServer = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  validateStatus: (status) => {
    return status >= 200 && status < 300;
  },
});

axiosServer.interceptors.request.use(
  async function (config) {
    const cookieStore = await cookies();
    const token = cookieStore.get(ACCESS_TOKEN_KEY)?.value;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  function (error) {
    return Promise.reject(error);
  },
);

axiosServer.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    const originalConfig = error.config;

    if (
      error.response &&
      error.response.status === UNAUTHORIZED_STATUS &&
      !originalConfig._retry
    ) {
      originalConfig._retry = true;
      return axiosServer(originalConfig);
    }

    return Promise.reject(error);
  },
);

export default axiosServer;
