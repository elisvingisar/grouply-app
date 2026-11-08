const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

export interface AuthResponse {
  token: string;
  userId: number;
  email: string;
  name: string;
}

export interface LoginRequest { email: string; password: string; }
export interface RegisterRequest { name: string; email: string; password: string; }

export type StoredUser = {
  id: number;
  email: string;
  name: string;
};

export function saveAuth(token: string, user: StoredUser) {
  localStorage.setItem("authToken", token);
  localStorage.setItem("user", JSON.stringify(user));
}

function userFromAuthResponse(data: AuthResponse): StoredUser {
  return { id: data.userId, email: data.email, name: data.name };
}

export function getToken(): string | null {
  return localStorage.getItem("authToken");
}
export function setToken(token: string): void {
  localStorage.setItem("authToken", token);
}
export function clearToken(): void {
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
}
export function isAuthenticated(): boolean {
  return !!getToken();
}

export async function login(req: LoginRequest): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE.replace(/\/+$/,'')}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error("Login failed");
  const data = (await res.json()) as AuthResponse;
  saveAuth(data.token, userFromAuthResponse(data));
  return data;
}

export async function register(req: RegisterRequest): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE.replace(/\/+$/,'')}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error("Registration failed");
  const data = (await res.json()) as AuthResponse;
  saveAuth(data.token, userFromAuthResponse(data));
  return data;
}

export async function getCurrentUser() {
  const token = getToken();
  if (!token) return null;
  const res = await fetch(`${API_BASE.replace(/\/+$/,'')}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}