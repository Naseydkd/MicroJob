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

export async function refreshAdminToken(): Promise<void> {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (!token) return;
  try {
    const res = await fetch("/auth/refresh", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (data.accessToken) {
      localStorage.setItem(ADMIN_TOKEN_KEY, data.accessToken);
      localStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify({
        id: data.userId, email: data.email, nom: data.nom, adminRole: data.adminRole,
      }));
    }
  } catch {}
}
