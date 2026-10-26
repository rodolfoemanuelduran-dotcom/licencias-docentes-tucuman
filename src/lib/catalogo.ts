import catalogo from '../data/licencias.json';
import type { LicenciaCatalogo } from '../types';

export const LICENCIAS = catalogo as LicenciaCatalogo[];

export function buscarTipo(id: string): LicenciaCatalogo | undefined {
  return LICENCIAS.find((l) => l.id === id);
}

const plano = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** "art. 38 inc. b", "38 b" o "38B" → "38b". */
const referencia = (s: string) => plano(s).replace(/\b(art|articulo|arts|inc|inciso|apartado|ap)\b/g, ' ').replace(/\s+/g, '');

/**
 * Busca por artículo e inciso ("38b", "art 38 b", "10 c", "ley 9254") o por palabras
 * (todas deben aparecer en el nombre o, si `amplio`, también en duración, requisitos y documentación).
 */
export function coincide(l: LicenciaCatalogo, consulta: string, amplio = false): boolean {
  const q = plano(consulta);
  if (!q) return true;
  const ref = referencia(consulta);
  if (/\d/.test(ref)) {
    const propias = [referencia(`${l.articulo} ${l.inciso}`), referencia(l.articulo)];
    // "10" no debe encontrar el "100", pero "10c" sí encuentra "10c2" (art. 10 inc. c, apartado 2).
    const es = propias.some((p) => p === ref || (p.startsWith(ref) && !(/\d$/.test(ref) && /\d/.test(p.charAt(ref.length)))));
    // Si escribieron una referencia ("38b", "ley 9254"), se muestra solo ese artículo.
    if (es || /^(ley)?\d+[a-z]?\d*$/.test(ref)) return es;
  }
  const texto = plano(
    [l.nombre, `articulo ${l.articulo} ${l.inciso}`, ...(amplio ? [l.duracion, l.goce, l.requisitos.join(' '), l.documentacion.join(' ')] : [l.requisitos.join(' ')])].join(' '),
  );
  return q.split(' ').every((palabra) => texto.includes(palabra));
}
