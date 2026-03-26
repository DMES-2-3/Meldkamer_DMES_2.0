import { apiUrl } from "./api";

let csrfTokenCache = null;

export async function getCsrfToken() {
  if (csrfTokenCache) return csrfTokenCache;

  const res = await fetch(apiUrl("src/api/v1/user/csrf"), {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`CSRF ophalen mislukt: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  if (!data?.csrf_token) {
    throw new Error("Geen CSRF-token ontvangen.");
  }

  csrfTokenCache = data.csrf_token;
  return csrfTokenCache;
}

export function clearCsrfToken() {
  csrfTokenCache = null;
}