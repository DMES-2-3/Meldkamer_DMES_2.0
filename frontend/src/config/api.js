export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL?.replace(/\/+$/, "") ||
  "http://46.224.225.189:8080";

export function apiUrl(path = "") {
  const suffix = String(path || "").replace(/^\/+/, "");
  return `${API_BASE_URL}/${suffix}`;
}