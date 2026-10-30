import type { Cupo, Escuela, Licencia, LicenciaCatalogo, Revista } from '../types';
import { LICENCIAS } from './catalogo';
import { calcularDias, contarDias, sumarAnios } from './dias';

/** Días que el docente usó por fuera de la app, por año y por grupo de cupo. */
export type UsosPrevios = Record<string, Record<string, number>>;

export interface Saldo {
  tipo: LicenciaCatalogo;
  cupo: Cupo;
  usados: number;
  disponibles: number;
  /** Texto del período que se cuenta: "en 2026", "en los últimos 5 años"… */
  periodo: string;
  /** Si el tope es mensual: 0 cuando ya se usó el de este mes. */
  esteMes?: number;
}

export interface Corresponde {
  corresponde: boolean;
  motivo?: string;
}

const NOMBRE_REVISTA: Record<string, string> = { titular: 'titular', interino: 'interino/a', suplente: 'suplente', contratado: 'contratado/a' };

/** El contratado tiene el mismo régimen que el suplente (art. 38). */
export const grupoRevista = (r: Revista): Revista => (r === 'contratado' ? 'suplente' : r);

/** Años cumplidos desde la fecha de ingreso, o null si no se cargó. */
export function aniosDesde(fecha: string, hoy: string): number | null {
  if (!calcularDias(fecha, hoy)) return null;
  const [a, m, d] = fecha.split('-').map(Number);
  const [ah, mh, dh] = hoy.split('-').map(Number);
  return ah - a - (mh < m || (mh === m && dh < d) ? 1 : 0);
}

/** Indica si la licencia corresponde según la situación de revista y la antigüedad. */
export function corresponde(tipo: LicenciaCatalogo, revista: Revista | '', fechaIngreso: string, hoy: string): Corresponde {
  if (!revista) return { corresponde: true };
  if (tipo.revista && !tipo.revista.includes(grupoRevista(revista))) {
    return { corresponde: false, motivo: `No está prevista para personal ${NOMBRE_REVISTA[revista]} (arts. 3, 37 y 38).` };
  }
  if (tipo.antiguedad) {
    const a = aniosDesde(fechaIngreso, hoy);
    if (a !== null && a < tipo.antiguedad) return { corresponde: false, motivo: `Pide ${tipo.antiguedad} años de antigüedad en el cargo y tenés ${a}.` };
  }
  return { corresponde: true };
}

function licenciasDelGrupo(cupo: Cupo, licencias: Licencia[]): Licencia[] {
  const ids = LICENCIAS.filter((t) => t.cupo?.grupo === cupo.grupo).map((t) => t.id);
  return licencias.filter((l) => l.estado === 'final' && l.desde && l.hasta && ids.includes(l.tipoId));
}

/** Suma los días de las licencias dentro de un rango de fechas (recorta las que lo cruzan). */
function usadosEntre(lista: Licencia[], ini: string, fin: string, cupo: Cupo): number {
  return lista.reduce((t, l) => {
    const d = l.desde > ini ? l.desde : ini;
    const h = l.hasta < fin ? l.hasta : fin;
    return t + (d <= h ? contarDias(d, h, cupo.unidad) : 0);
  }, 0);
}

/** Largo tratamiento: suma los períodos mientras entre ellos no pasen más de 2 años (art. 10 inc. c). */
function usadosContinuidad(lista: Licencia[], cupo: Cupo): number {
  const orden = [...lista].sort((a, b) => b.desde.localeCompare(a.desde));
  let total = 0;
  let siguiente = '';
  for (const l of orden) {
    if (siguiente && sumarAnios(l.hasta, 2) < siguiente) break;
    total += contarDias(l.desde, l.hasta, cupo.unidad);
    siguiente = l.desde;
  }
  return total;
}

export function calcularSaldo(tipo: LicenciaCatalogo, licencias: Licencia[], previos: UsosPrevios, hoy: string): Saldo | null {
  const cupo = tipo.cupo;
  if (!cupo) return null;
  const anio = hoy.slice(0, 4);
  const lista = licenciasDelGrupo(cupo, licencias);
  const previo = previos[anio]?.[cupo.grupo] ?? 0;
  let usados: number;
  let periodo: string;
  if (cupo.periodo === 'anio') {
    usados = usadosEntre(lista, `${anio}-01-01`, `${anio}-12-31`, cupo) + previo;
    periodo = `en ${anio}`;
  } else if (cupo.periodo === 'continuidad') {
    usados = usadosContinuidad(lista, cupo) + previo;
    periodo = 'sumando los períodos sin cortes de más de 2 años';
  } else {
    const anios = cupo.periodo === 'quinquenio' ? 5 : 6;
    usados = usadosEntre(lista, sumarAnios(hoy, -anios), hoy, cupo) + previo;
    periodo = `en los últimos ${anios} años`;
  }
  const saldo: Saldo = { tipo, cupo, usados, disponibles: Math.max(0, cupo.cantidad - usados), periodo };
  if (cupo.mensual) {
    const mes = hoy.slice(0, 7);
    const fin = new Date(Date.UTC(Number(hoy.slice(0, 4)), Number(hoy.slice(5, 7)), 0)).toISOString().slice(0, 10);
    const usadosMes = usadosEntre(lista, `${mes}-01`, fin, cupo);
    saldo.esteMes = Math.max(0, cupo.mensual - usadosMes);
  }
  return saldo;
}

/** Saldos de las licencias con tope, sin repetir grupos, según la situación de revista. */
export function saldosDisponibles(revista: Revista | '', licencias: Licencia[], previos: UsosPrevios, hoy: string): Saldo[] {
  const vistos = new Set<string>();
  const out: Saldo[] = [];
  for (const t of LICENCIAS) {
    if (!t.cupo || vistos.has(t.cupo.grupo)) continue;
    if (revista && !corresponde(t, revista, '', hoy).corresponde) continue;
    const s = calcularSaldo(t, licencias, previos, hoy);
    if (s) {
      vistos.add(t.cupo.grupo);
      out.push(s);
    }
  }
  return out;
}

/** Última donación de sangre registrada y cuándo se puede volver a usar (art. 51 inc. b). */
export function proximaFecha(tipo: LicenciaCatalogo, licencias: Licencia[], hoy: string): string | null {
  if (!tipo.intervalo) return null;
  const ultima = licencias.filter((l) => l.estado === 'final' && l.tipoId === tipo.id && l.desde).map((l) => l.desde).sort().pop();
  if (!ultima) return null;
  const f = new Date(`${ultima}T00:00:00Z`);
  f.setUTCDate(f.getUTCDate() + tipo.intervalo);
  const iso = f.toISOString().slice(0, 10);
  return iso > hoy ? iso : null;
}

/** Revista de referencia para los cálculos: la de la escuela principal (o la primera cargada). */
export function revistaPrincipal(escuelas: Escuela[]): { revista: Revista | ''; fechaIngreso: string } {
  const e = escuelas.find((x) => x.principal && x.revista) ?? escuelas.find((x) => x.revista);
  return { revista: e?.revista ?? '', fechaIngreso: e?.fechaIngreso ?? '' };
}

/** Hoy en fecha ISO local. */
export function hoyISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
