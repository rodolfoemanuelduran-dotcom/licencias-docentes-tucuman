import catalogo from '../data/licencias.json';
import type { LicenciaCatalogo } from '../types';

export const LICENCIAS = catalogo as LicenciaCatalogo[];

export function buscarTipo(id: string): LicenciaCatalogo | undefined {
  return LICENCIAS.find((l) => l.id === id);
}
