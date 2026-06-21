import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export const api = axios.create({ baseURL });

const TOKEN_KEY = "polyclinic_token";

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem(TOKEN_KEY);
    delete api.defaults.headers.common.Authorization;
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// Initialise from storage so refreshes stay logged in.
const stored = getStoredToken();
if (stored) {
  api.defaults.headers.common.Authorization = `Bearer ${stored}`;
}

/** Pulls a human-friendly message out of an axios error. */
export function apiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return (
      (err.response?.data as { message?: string })?.message ||
      err.message ||
      "Something went wrong"
    );
  }
  return "Something went wrong";
}
