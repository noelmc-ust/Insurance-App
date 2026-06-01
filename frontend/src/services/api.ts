const configured = import.meta.env.VITE_API_BASE;
export const API_BASE = configured || "";

export function getToken() {
  return localStorage.getItem("token") || "";
}

export async function api(path: string, init: RequestInit = {}) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const headers = new Headers(init.headers || {});
  headers.set("Accept", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${API_BASE}${normalizedPath}`, { ...init, headers });
  if (!res.ok) {
    if (res.status === 401) localStorage.removeItem("token");
    const body = await res.text();
    const err = new Error(body || `HTTP ${res.status}`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}
