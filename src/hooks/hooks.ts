import { useCallback, useEffect, useState } from 'react';

export function useMediaQuery(q: string): boolean {
  const [ok, setOk] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const f = () => setOk(m.matches);
    m.addEventListener('change', f);
    f();
    return () => m.removeEventListener('change', f);
  }, [q]);
  return ok;
}

export const useEsEscritorio = () => useMediaQuery('(min-width: 1024px)');

/** Ruta por hash: "#/nueva/abc" → ["nueva", "abc"]. */
export function useRuta(): [string[], (r: string) => void] {
  const leer = () => window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const [ruta, setRuta] = useState(leer);
  useEffect(() => {
    const f = () => setRuta(leer());
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  const ir = useCallback((r: string) => {
    window.location.hash = '#/' + r;
  }, []);
  return [ruta, ir];
}

/** Llama a `alVencer` tras `minutos` sin actividad. Con 0 minutos, no hace nada. */
export function useInactividad(minutos: number, activo: boolean, alVencer: () => void): void {
  useEffect(() => {
    if (!activo || minutos <= 0) return;
    let t = window.setTimeout(alVencer, minutos * 60_000);
    const reiniciar = () => {
      window.clearTimeout(t);
      t = window.setTimeout(alVencer, minutos * 60_000);
    };
    const evs = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
    evs.forEach((e) => window.addEventListener(e, reiniciar, { passive: true }));
    return () => {
      window.clearTimeout(t);
      evs.forEach((e) => window.removeEventListener(e, reiniciar));
    };
  }, [minutos, activo, alVencer]);
}

export function useAtajos(mapa: Record<string, (e: KeyboardEvent) => void>): void {
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      const k = (e.ctrlKey || e.metaKey ? 'ctrl+' : '') + e.key.toLowerCase();
      const h = mapa[k];
      if (h) {
        e.preventDefault();
        h(e);
      }
    };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  });
}
