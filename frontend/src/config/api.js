const rawBaseUrl = process.env.REACT_APP_API_BASE_URL || "";

export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "");

export function apiUrl(path = "") {
  const suffix = String(path || "").replace(/^\/+/, "");
  return API_BASE_URL ? `${API_BASE_URL}/${suffix}` : `/${suffix}`;
}