export const ITERACIONES = 600_000;

export interface Sobre {
  iv: string;
  data: string;
}

const enc = new TextEncoder();
const dec = new TextDecoder();

export function aBase64(b: Uint8Array): string {
  let s = '';
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s);
}

export function deBase64(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function nuevaSal(): string {
  return aBase64(crypto.getRandomValues(new Uint8Array(16)));
}

export async function derivarClave(password: string, sal: string, iteraciones = ITERACIONES): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: deBase64(sal) as BufferSource, iterations: iteraciones, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function cifrar(clave: CryptoKey, valor: unknown): Promise<Sobre> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const buf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, clave, enc.encode(JSON.stringify(valor)));
  return { iv: aBase64(iv), data: aBase64(new Uint8Array(buf)) };
}

/** Lanza un error si la clave es incorrecta o los datos fueron alterados. */
export async function descifrar<T = unknown>(clave: CryptoKey, sobre: Sobre): Promise<T> {
  const buf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: deBase64(sobre.iv) as BufferSource }, clave, deBase64(sobre.data) as BufferSource);
  return JSON.parse(dec.decode(buf)) as T;
}
