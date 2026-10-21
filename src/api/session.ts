import AsyncStorage from '@react-native-async-storage/async-storage';

// TEMPORARY test access. Replace with institutional authentication.
export const apiEnabled = !!process.env.EXPO_PUBLIC_API_URL;
const base = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');
const key = 'bora:temporary-api-session:v1';
type User = { id: string; display_name: string };
type Session = { token: string; user: User; expires_at: string };

export class ApiError extends Error {
  constructor(public status: number, message: string, public errors: Record<string, string[]> = {}) { super(message); }
}
const listeners = new Set<() => void>();
export function onSessionExpired(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }

export async function apiRequest(path: string, init: RequestInit = {}) {
  if (!apiEnabled) throw new ApiError(0, 'A conexão com o serviço não está configurada.');
  const raw = await AsyncStorage.getItem(key);
  const session: Session | null = raw ? JSON.parse(raw) : null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${base}${path}`, {
      ...init, signal: controller.signal,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.token}` } : {}), ...init.headers },
    });
    const body = await response.json().catch(() => ({}));
    if (response.status === 401 && raw && await AsyncStorage.getItem(key) === raw) {
      await AsyncStorage.removeItem(key);
      listeners.forEach(listener => listener());
    }
    if (!response.ok) {
      const message = response.status === 401 ? 'Sua sessão expirou. Entre novamente.'
        : response.status >= 500 ? 'O serviço está temporariamente indisponível. Tente novamente em instantes.'
        : response.status === 429 ? 'Muitas solicitações. Aguarde um momento e tente novamente.'
        : Object.values(body.errors ?? {}).flat()[0] || body.message || 'Não foi possível concluir a solicitação. Tente novamente.';
      throw new ApiError(response.status, String(message), body.errors);
    }
    return body;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, 'Não foi possível conectar. Verifique sua conexão e tente novamente.');
  } finally { clearTimeout(timer); }
}

export async function restoreApiSession(): Promise<User | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  const session: Session = JSON.parse(raw);
  if (Date.parse(session.expires_at) <= Date.now()) {
    await AsyncStorage.removeItem(key);
    return null;
  }
  try {
    const result = await apiRequest('/me');
    return result.data;
  } catch (error) {
    if (!await AsyncStorage.getItem(key)) return null;
    throw error;
  }
}

export async function loginForTesting(): Promise<User> {
  const existing = await restoreApiSession();
  if (existing) return existing;
  const result = await apiRequest('/auth/test-login', { method: 'POST' });
  await AsyncStorage.setItem(key, JSON.stringify(result.data));
  return result.data.user;
}

export async function clearApiSession() {
  await AsyncStorage.removeItem(key);
}
