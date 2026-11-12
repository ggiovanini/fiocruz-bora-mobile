import * as Crypto from 'expo-crypto';
import { getApiBaseUrl } from './config';

// This check prevents accidental use against online services. Authorization is enforced by the API.
export function useLocalLogin(): boolean {
  if (process.env.EXPO_PUBLIC_LOCAL_LOGIN_ENABLED !== 'true') return false;
  let local = false;
  try {
    const url = new URL(getApiBaseUrl());
    const host = url.hostname;
    const ipv4 = host.split('.').map(Number);
    const privateIpv4 = ipv4.length === 4 && ipv4.every(n => Number.isInteger(n) && n >= 0 && n <= 255)
      && (ipv4[0] === 127 || ipv4[0] === 10 || (ipv4[0] === 192 && ipv4[1] === 168)
        || (ipv4[0] === 172 && ipv4[1] >= 16 && ipv4[1] <= 31));
    local = ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password
      && (host === 'localhost' || host === '[::1]' || privateIpv4);
  } catch { /* Invalid addresses cannot enable development login. */ }
  if (!__DEV__ || !local) throw new Error('O login de teste exige uma build de desenvolvimento conectada à API local. Desative EXPO_PUBLIC_LOCAL_LOGIN_ENABLED para usar o Login Único.');
  return true;
}

export async function localLogin(request: (path: string, init: RequestInit) => Promise<any>) {
  if (!useLocalLogin()) throw new Error('O login de teste local está desabilitado.');
  const { data } = await request('/auth/test-login', { method: 'POST' });
  return { ...data, installation_id: Crypto.randomUUID() };
}
