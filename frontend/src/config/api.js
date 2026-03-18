export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "");

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not defined");
}

export function apiUrl(path = "") {
  const suffix = String(path).replace(/^\/+/, "");
  return `${API_BASE_URL}/${suffix}`;
}