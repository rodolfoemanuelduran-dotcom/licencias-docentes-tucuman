const ISO = /^\d{4}-\d{2}-\d{2}$/;

function aUTC(iso: string): number | null {
  if (!ISO.test(iso)) return null;
  const [a, m, d] = iso.split('-').map(Number);
  const t = Date.UTC(a, m - 1, d);
  const f = new Date(t);
  if (f.getUTCFullYear() !== a || f.getUTCMonth() !== m - 1 || f.getUTCDate() !== d) return null;
  return t;
}

/** Días corridos entre dos fechas ISO, ambas incluidas. null si falta una fecha, es inválida o el fin es anterior al inicio. */
export function calcularDias(desde: string, hasta: string): number | null {
  const a = aUTC(desde);
  const b = aUTC(hasta);
  if (a === null || b === null || b < a) return null;
  return Math.round((b - a) / 86_400_000) + 1;
}

export function formatearFecha(iso: string): string {
  if (!aUTC(iso)) return '';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}
