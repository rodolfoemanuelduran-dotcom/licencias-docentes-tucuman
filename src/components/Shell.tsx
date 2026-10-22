import type { ReactNode } from 'react';
import { AvisoNoOficial } from './ui';

export const SECCIONES = [
  { id: 'inicio', texto: 'Inicio', icono: '🏠' },
  { id: 'nueva', texto: 'Nueva licencia', icono: '📝' },
  { id: 'mis', texto: 'Mis licencias', icono: '📁' },
  { id: 'info', texto: 'Información', icono: 'ℹ️' },
  { id: 'cuenta', texto: 'Cuenta', icono: '👤' },
];

export default function Shell({ seccion, irA, children }: { seccion: string; irA: (r: string) => void; children: ReactNode }) {
  const activa = seccion === 'privacidad' ? 'cuenta' : seccion;
  return (
    <div className="min-h-screen lg:flex">
      <nav aria-label="Secciones" className="hidden w-64 shrink-0 flex-col gap-1 border-r border-slate-200 bg-white p-4 lg:flex">
        <h1 className="mb-1 text-xl font-bold text-marca-900">Licencias Docentes Tucumán</h1>
        <p className="mb-4 text-sm text-slate-600">Herramienta independiente, no oficial.</p>
        {SECCIONES.map((s) => (
          <button
            key={s.id}
            onClick={() => irA(s.id)}
            aria-current={activa === s.id ? 'page' : undefined}
            className={`flex min-h-[48px] items-center gap-3 rounded-xl px-4 text-left text-base font-semibold ${
              activa === s.id ? 'bg-marca-100 text-marca-900' : 'text-slate-800 hover:bg-slate-100'
            }`}
          >
            <span aria-hidden>{s.icono}</span> {s.texto}
          </button>
        ))}
        <p className="mt-auto pt-4 text-xs text-slate-600">Ctrl+N nueva · Ctrl+S guardar · Ctrl+P imprimir · Esc cerrar</p>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-slate-200 bg-marca-600 px-4 py-3 text-white lg:hidden">
          {activa !== 'inicio' && (
            <button className="min-h-[48px] min-w-[48px] rounded-xl text-2xl hover:bg-white/10" onClick={() => irA('inicio')} aria-label="Volver al inicio">
              ←
            </button>
          )}
          <h1 className="text-lg font-bold">Licencias Docentes Tucumán</h1>
        </header>
        <main className="mx-auto w-full max-w-md flex-1 px-4 py-5 lg:max-w-none lg:px-8 lg:py-6">{children}</main>
        <footer className="px-4 pb-6 lg:hidden">
          <AvisoNoOficial />
        </footer>
      </div>
    </div>
  );
}
