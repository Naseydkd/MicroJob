export const AUTH_USER_KEY = "microjob_auth_user";
export const AUTH_TOKEN_KEY = "access_token";

export type AuthUser = {
  id: string;
  email: string;
  userType: "jeune" | "entreprise" | "admin";
  nom: string | null;
  prenom: string | null;
  telephone: string | null;
  ville: string | null;
};

export function getAuthUser(): AuthUser | null {
  try {
    const raw = window.localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function saveAuthUser(user: AuthUser, token: string) {
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthUser() {
  window.localStorage.removeItem(AUTH_USER_KEY);
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function getAuthToken(): string | null {
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}
