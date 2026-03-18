export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL?.replace(/\/+$/, "");

if (!API_BASE_URL) {
  throw new Error("REACT_APP_API_BASE_URL is not defined");
}

export function apiUrl(path = "") {
  const suffix = String(path).replace(/^\/+/, "");
  return `${API_BASE_URL}/${suffix}`;
}