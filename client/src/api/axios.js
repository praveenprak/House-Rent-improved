import axios from "axios";

// In local dev, Vite proxies "/api" to the backend (see vite.config.js).
// In production (Vercel) set VITE_API_URL to your deployed backend URL,
// e.g. https://houserent-api.vercel.app  (no trailing slash needed).
export const API_ORIGIN = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("houserent_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
