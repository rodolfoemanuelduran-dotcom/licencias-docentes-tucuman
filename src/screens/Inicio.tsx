import { useEffect, useState } from 'react';
import type { Contexto } from '../App';
import { listarRegistros } from '../lib/db';
import { buscarTipo } from '../lib/catalogo';
import type { Licencia } from '../types';

const BOTONES = [
  { id: 'nueva', texto: 'Nueva licencia', sub: 'Completá el parte y descargá el PDF', icono: '📝' },
  { id: 'mis', texto: 'Mis licencias', sub: 'Tu historial en este dispositivo', icono: '📁' },
  { id: 'guia', texto: '¿Qué licencia me corresponde?', sub: 'Respondé unas preguntas y te orienta', icono: '🧭' },
  { id: 'disponibles', texto: 'Mis disponibles', sub: 'Cuántos días te quedan de cada licencia', icono: '📊' },
  { id: 'info', texto: 'Información', sub: 'Tipos de licencia, requisitos y documentación', icono: 'ℹ️' },
  { id: 'cuenta', texto: 'Cuenta', sub: 'Tus datos, seguridad y copia de seguridad', icono: '👤' },
];

export default function Inicio({ ctx }: { ctx: Contexto }) {
  const [borrador, setBorrador] = useState<Licencia | null>(null);
  useEffect(() => {
    listarRegistros<Licencia>('licencia').then((ls) => {
      const b = ls.filter((l) => l.estado === 'borrador').sort((a, b) => b.actualizadaEn.localeCompare(a.actualizadaEn))[0];
      setBorrador(b ?? null);
    });
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h2 className="text-2xl font-bold">¡Hola{ctx.docente.nombres ? `, ${ctx.docente.nombres.split(' ')[0]}` : ''}!</h2>
      <p className="text-base text-slate-700">Tocá una opción para empezar.</p>
      {borrador && (
        <button className="tarjeta w-full border-2 border-amber-400 bg-amber-50 text-left" onClick={() => ctx.irA('nueva/' + borrador.id)}>
          <span className="block text-base font-bold">Seguí donde dejaste</span>
          <span className="block text-base">Borrador: {buscarTipo(borrador.tipoId)?.nombre ?? 'licencia sin tipo'}</span>
        </button>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {BOTONES.map((b) => (
          <button
            key={b.id}
            onClick={() => ctx.irA(b.id)}
            className="flex min-h-[96px] items-center gap-4 rounded-2xl border-2 border-marca-600/20 bg-white p-4 text-left shadow-sm hover:bg-marca-50"
          >
            <span className="text-4xl" aria-hidden>
              {b.icono}
            </span>
            <span>
              <span className="block text-lg font-bold text-marca-900">{b.texto}</span>
              <span className="block text-base text-slate-700">{b.sub}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
