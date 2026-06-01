const configured = import.meta.env.VITE_API_BASE;
export const API_BASE = configured || "";

export function getToken() {
  return localStorage.getItem("token") || "";
}

export async function api(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Accept", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}
