import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { getApiBaseUrl } from './config';

const origin = 'https://bora.dmgn.com.br';
export const institutionalReturnUrl = 'bora://auth/fiocruz';
export function validateInstitutionalReturn(url: string, state: string): string {
  const result = new URL(url);
  if (`${result.protocol}//${result.host}${result.pathname}` !== institutionalReturnUrl
    || result.searchParams.getAll('state').length !== 1 || result.searchParams.get('state') !== state) {
    throw new Error('O retorno do Login Único não corresponde a esta tentativa. Entre novamente.');
  }
  if (result.searchParams.has('error')) throw new Error('Não foi possível entrar. Confira sua liberação de acesso ou tente novamente.');
  const code = result.searchParams.get('code');
  if (!code || !/^[a-f0-9]{64}$/.test(code) || result.searchParams.getAll('code').length !== 1) {
    throw new Error('O retorno do Login Único é inválido. Entre novamente.');
  }
  return code;
}

let running = false;
export async function institutionalLogin(request: (path: string, init: RequestInit) => Promise<any>) {
  if (running) throw new Error('Já existe uma tentativa de login em andamento.');
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') throw new Error('Use o aplicativo instalado para entrar com Login Único.');
  if (getApiBaseUrl() !== `${origin}/api/v1`) throw new Error('O Login Único está disponível apenas no ambiente de testes online.');
  running = true;
  try {
    // Randomness for authentication must never use Math.random or the operation UUID fallback.
    const verifier = [...await Crypto.getRandomBytesAsync(32)].map(b => b.toString(16).padStart(2, '0')).join('');
    const state = [...await Crypto.getRandomBytesAsync(32)].map(b => b.toString(16).padStart(2, '0')).join('');
    const challenge = (await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier, { encoding: Crypto.CryptoEncoding.BASE64 }))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const installation = Crypto.randomUUID();
    const start = await request('/auth/fiocruz/start', { method: 'POST', body: JSON.stringify({
      challenge, state, installation_id: installation, platform: Platform.OS,
    }) });
    const authorize = new URL(start.data.authorize_url);
    if (authorize.origin !== origin || authorize.pathname !== '/auth/fiocruz/redirect') throw new Error('Endereço de autenticação inválido.');
    const result = await WebBrowser.openAuthSessionAsync(authorize.toString(), institutionalReturnUrl);
    if (result.type !== 'success') throw new Error('Login cancelado. Você pode tentar novamente.');
    const code = validateInstitutionalReturn(result.url, state);
    return (await request('/auth/fiocruz/exchange', { method: 'POST', body: JSON.stringify({ code, verifier }) })).data;
  } finally { running = false; }
}
