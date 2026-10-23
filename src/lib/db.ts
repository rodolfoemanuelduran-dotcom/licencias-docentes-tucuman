import Dexie, { type Table } from 'dexie';
import { ITERACIONES, cifrar, derivarClave, descifrar, nuevaSal, type Sobre } from './cripto';

type Tabla = 'docente' | 'licencia';

interface Meta {
  k: string;
  v: unknown;
}
interface Registro {
  id: string;
  tabla: Tabla;
  ts: string;
  /** Objeto en claro, o un sobre AES-GCM si el cifrado está activado. */
  payload: unknown;
}

export interface Config {
  consentimiento: boolean;
  cifrado: boolean;
  sal: string;
  iteraciones: number;
  verificador: Sobre | null;
  bloqueoMin: number;
  /** Guardar datos personales y escuelas para precargarlos en la próxima licencia. */
  recordarDatos: boolean;
  /** Guardar la firma dibujada para reutilizarla. */
  recordarFirma: boolean;
}

const CONFIG_INICIAL: Config = { consentimiento: false, cifrado: false, sal: '', iteraciones: ITERACIONES, verificador: null, bloqueoMin: 5, recordarDatos: true, recordarFirma: true };

class BD extends Dexie {
  meta!: Table<Meta, string>;
  registros!: Table<Registro, string>;
  constructor() {
    super('licencias-docentes');
    this.version(1).stores({ meta: 'k', registros: 'id, tabla' });
  }
}

export const bd = new BD();

let clave: CryptoKey | null = null;

export async function leerConfig(): Promise<Config> {
  const m = await bd.meta.get('config');
  return { ...CONFIG_INICIAL, ...((m?.v as Partial<Config>) ?? {}) };
}

export async function guardarConfig(parcial: Partial<Config>): Promise<Config> {
  const c = { ...(await leerConfig()), ...parcial };
  await bd.meta.put({ k: 'config', v: c });
  return c;
}

export async function estaBloqueada(): Promise<boolean> {
  return (await leerConfig()).cifrado && clave === null;
}

export function bloquear(): void {
  clave = null;
}

export async function desbloquear(password: string): Promise<void> {
  const c = await leerConfig();
  if (!c.cifrado || !c.verificador) return;
  const k = await derivarClave(password, c.sal, c.iteraciones);
  try {
    await descifrar(k, c.verificador);
  } catch {
    throw new Error('Contraseña incorrecta.');
  }
  clave = k;
}

async function envolver(valor: unknown): Promise<unknown> {
  return clave ? cifrar(clave, valor) : valor;
}

async function abrir(r: Registro): Promise<unknown> {
  const p = r.payload as Sobre;
  if (clave && p && typeof p === 'object' && 'iv' in p && 'data' in p) return descifrar(clave, p);
  return r.payload;
}

/** Última escritura en curso: las lecturas la esperan para no ver datos viejos (p. ej. al salir de un borrador). */
let escrituras: Promise<unknown> = Promise.resolve();

export function guardarRegistro(tabla: Tabla, id: string, valor: unknown): Promise<void> {
  const p = (async () => {
    if ((await leerConfig()).cifrado && !clave) throw new Error('La app está bloqueada.');
    await bd.registros.put({ id, tabla, ts: new Date().toISOString(), payload: await envolver(valor) });
  })();
  escrituras = Promise.all([escrituras, p.catch(() => undefined)]);
  return p;
}

export async function leerRegistro<T>(tabla: Tabla, id: string): Promise<T | undefined> {
  await escrituras;
  const r = await bd.registros.get(id);
  return r && r.tabla === tabla ? ((await abrir(r)) as T) : undefined;
}

export async function listarRegistros<T>(tabla: Tabla): Promise<T[]> {
  await escrituras;
  const rs = await bd.registros.where('tabla').equals(tabla).toArray();
  return Promise.all(rs.map((r) => abrir(r) as Promise<T>));
}

export async function borrarRegistro(id: string): Promise<void> {
  await bd.registros.delete(id);
}

export async function borrarTodo(): Promise<void> {
  clave = null;
  await bd.delete();
  await bd.open();
}

async function reescribir(nuevaClave: CryptoKey | null): Promise<void> {
  const todos = await bd.registros.toArray();
  const planos = await Promise.all(todos.map(async (r) => ({ r, v: await abrir(r) })));
  clave = nuevaClave;
  // El cifrado (Web Crypto) va fuera de la transacción: IndexedDB la cierra si espera algo ajeno a Dexie.
  const nuevos = await Promise.all(planos.map(async ({ r, v }) => ({ ...r, payload: await envolver(v) })));
  await bd.registros.bulkPut(nuevos);
}

/** Activa el cifrado con contraseña propia y cifra todo lo que ya estaba guardado. */
export async function activarCifrado(password: string): Promise<void> {
  const sal = nuevaSal();
  const k = await derivarClave(password, sal, ITERACIONES);
  const verificador = await cifrar(k, { ok: true });
  await reescribir(k);
  await guardarConfig({ cifrado: true, sal, iteraciones: ITERACIONES, verificador });
}

export async function desactivarCifrado(): Promise<void> {
  if (!clave) throw new Error('La app está bloqueada.');
  await reescribir(null);
  await guardarConfig({ cifrado: false, sal: '', verificador: null });
}

export async function cambiarClave(actual: string, nueva: string): Promise<void> {
  await desbloquear(actual);
  const sal = nuevaSal();
  const k = await derivarClave(nueva, sal, ITERACIONES);
  const verificador = await cifrar(k, { ok: true });
  await reescribir(k);
  await guardarConfig({ sal, iteraciones: ITERACIONES, verificador });
}

/** Copia de seguridad siempre cifrada con la contraseña que se elija para el archivo. */
export async function exportarBackup(password: string): Promise<string> {
  const todos = await bd.registros.toArray();
  const planos = await Promise.all(todos.map(async (r) => ({ id: r.id, tabla: r.tabla, ts: r.ts, valor: await abrir(r) })));
  const sal = nuevaSal();
  const k = await derivarClave(password, sal, ITERACIONES);
  const sobre = await cifrar(k, planos);
  return JSON.stringify({ app: 'licencias-docentes-tucuman', v: 1, sal, iteraciones: ITERACIONES, ...sobre });
}

export async function importarBackup(texto: string, password: string): Promise<number> {
  const b = JSON.parse(texto) as { app?: string; sal: string; iteraciones: number; iv: string; data: string };
  if (b.app !== 'licencias-docentes-tucuman') throw new Error('Este archivo no es una copia de seguridad de la app.');
  const k = await derivarClave(password, b.sal, b.iteraciones);
  let planos: { id: string; tabla: Tabla; valor: unknown }[];
  try {
    planos = await descifrar(k, { iv: b.iv, data: b.data });
  } catch {
    throw new Error('Contraseña incorrecta o archivo dañado.');
  }
  for (const p of planos) await guardarRegistro(p.tabla, p.id, p.valor);
  return planos.length;
}
