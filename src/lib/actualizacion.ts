import { registerSW } from 'virtual:pwa-register';

/** Fecha de compilación: permite ver qué versión está usando cada docente. */
export const VERSION = __VERSION__;

let registro: ServiceWorkerRegistration | undefined;

async function buscar(): Promise<void> {
  if (navigator.onLine === false) return;
  await registro?.update().catch(() => undefined);
}

/**
 * Registra la app para que funcione sin conexión y busca versiones nuevas.
 * El navegador solo lo hace al abrir de cero: en el celular, tocar el ícono suele retomar la app
 * que quedó en segundo plano, y sin estos avisos nunca se enteraría de que hay una versión nueva.
 * Cuando la encuentra, la página se recarga sola con la versión nueva.
 */
export function iniciarActualizaciones(): void {
  registerSW({
    immediate: true,
    onRegisteredSW(_url, r) {
      registro = r;
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') void buscar();
      });
      window.addEventListener('focus', () => void buscar());
      window.addEventListener('online', () => void buscar());
      window.addEventListener('pageshow', () => void buscar());
      setInterval(() => void buscar(), 30 * 60_000);
    },
  });
}

/** Borra la copia guardada de la app y la baja de nuevo. Tus datos y licencias no se tocan. */
export async function forzarActualizacion(): Promise<void> {
  if (navigator.onLine === false) throw new Error('Necesitás conexión a internet para actualizar.');
  const registros = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registros.map((r) => r.unregister()));
  const claves = await caches.keys();
  await Promise.all(claves.map((k) => caches.delete(k)));
  window.location.reload();
}
