import { getApiBaseUrl } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { credentialStorage } from './credentialStorage';
import { institutionalLogin } from './institutionalLogin';
import { localLogin, useLocalLogin } from './localLogin';

// Institutional credentials are stored in the native secure store.
const base = getApiBaseUrl();
export const apiEnabled = !!base;
const legacyKey = 'bora:temporary-api-session:v1';
type User = { id: string; display_name: string };
type Session = { token: string; user: User; expires_at: string; installation_id: string };

export class ApiError extends Error {
  constructor(public status: number, message: string, public errors: Record<string, string[]> = {}, public retryAfterSeconds?: number) { super(message); }
}
const listeners = new Set<() => void>();
export function onSessionExpired(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }

// Share simultaneous reads and honor server cooldowns across all screens.
const pendingReads = new Map<string, Promise<any>>();
const cooldowns = new Map<string, number>();
export async function apiRequest(path: string, init: RequestInit = {}, expectedUserId?: string) {
  if (!apiEnabled) throw new ApiError(0, 'A conexão com o serviço não está configurada.');
  const raw = await credentialStorage.get();
  const session: Session | null = raw ? JSON.parse(raw) : null;
  if(expectedUserId && session?.user.id!==expectedUserId)throw new ApiError(401,'A conta mudou. Confira a sessão antes de enviar o treino.');
  const scope = session?.token ?? 'anonymous';
  const remaining = Math.ceil(((cooldowns.get(scope) ?? 0) - Date.now()) / 1000);
  if (remaining > 0) throw new ApiError(429, `Muitas solicitações. Tente novamente em ${remaining} segundos.`, {}, remaining);
  cooldowns.delete(scope);
  const readKey = (init.method ?? 'GET').toUpperCase() === 'GET' && !init.signal
    ? JSON.stringify([scope, path, init]) : undefined;
  if (readKey && pendingReads.has(readKey)) return pendingReads.get(readKey)!;
  const execute = async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`${base}${path}`, {
        ...init, signal: controller.signal,
        headers: { Accept: 'application/json', 'Content-Type': 'application/json',
          ...(session ? { Authorization: `Bearer ${session.token}` } : {}), ...init.headers },
      });
      const body = await response.json().catch(() => ({}));
      if (response.status === 401 && raw && await credentialStorage.get() === raw) {
        await credentialStorage.remove();
        listeners.forEach(listener => listener());
      }
      if (response.status === 429) {
        const retryAfter = response.headers?.get('Retry-After');
        const seconds = retryAfter && /^\d+$/.test(retryAfter) ? Number(retryAfter)
          : retryAfter ? Math.ceil((Date.parse(retryAfter) - Date.now()) / 1000) : 60;
        const wait = Number.isFinite(seconds) ? Math.max(1, seconds) : 60;
        cooldowns.set(scope, Date.now() + wait * 1000);
        throw new ApiError(429, `Muitas solicitações. Tente novamente em ${wait} segundos.`, {}, wait);
      }
      if (!response.ok) {
        const message = response.status === 401 ? 'Sua sessão expirou. Entre novamente.'
          : response.status >= 500 ? 'O serviço está temporariamente indisponível. Tente novamente em instantes.'
          : Object.values(body.errors ?? {}).flat()[0] || body.message || 'Não foi possível concluir a solicitação. Tente novamente.';
        throw new ApiError(response.status, String(message), body.errors);
      }
      return body;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(0, 'Não foi possível conectar. Verifique sua conexão e tente novamente.');
    } finally { clearTimeout(timer); }
  };
  const request = execute();
  if (!readKey) return request;
  pendingReads.set(readKey, request);
  try { return await request; }
  finally { if (pendingReads.get(readKey) === request) pendingReads.delete(readKey); }
}

export async function restoreApiSession(): Promise<User | null> {
  await AsyncStorage.removeItem(legacyKey);
  const raw = await credentialStorage.get();
  if (!raw) return null;
  let session: Session;
  try { session = JSON.parse(raw); } catch {
    await credentialStorage.remove();
    return null;
  }
  if (!session?.token || !session.user?.id || !session.installation_id
    || !Number.isFinite(Date.parse(session.expires_at)) || Date.parse(session.expires_at) <= Date.now()) {
    await credentialStorage.remove();
    return null;
  }
  try {
    const result = await apiRequest('/me');
    return result.data;
  } catch (error) {
    if (!await credentialStorage.get()) return null;
    throw error;
  }
}

export async function loginInstitutional(): Promise<User> {
  const local = useLocalLogin();
  const existing = await restoreApiSession();
  if (existing) return existing;
  const session: Session = await (local ? localLogin(apiRequest) : institutionalLogin(apiRequest));
  await credentialStorage.set(JSON.stringify(session));
  return session.user;
}

export async function sessionInstallation(userId: string): Promise<string | null> {
  const raw = await credentialStorage.get();
  const session: Session | null = raw ? JSON.parse(raw) : null;
  return session?.user.id === userId ? session.installation_id : null;
}

export async function clearApiSession() {
  await credentialStorage.remove();
}
