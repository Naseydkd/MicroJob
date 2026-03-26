export const ADMIN_AUTH_KEY = "microjob_admin_user";
export const ADMIN_TOKEN_KEY = "admin_token";

export function getAdminUser() {
  try {
    const raw = localStorage.getItem(ADMIN_AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function clearAdminAuth() {
  localStorage.removeItem(ADMIN_AUTH_KEY);
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export async function adminRequest(path: string, options: RequestInit = {}) {
  const token = getAdminToken();
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Erreur");
  return data;
}
