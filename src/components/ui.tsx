import { useEffect, useId, useRef, type ReactNode } from 'react';

export function Aviso({ tipo = 'info', children }: { tipo?: 'info' | 'alerta' | 'error'; children: ReactNode }) {
  const c = {
    info: 'border-marca-600/30 bg-marca-50 text-marca-900',
    alerta: 'border-amber-500 bg-amber-50 text-amber-900',
    error: 'border-red-600 bg-red-50 text-red-900',
  }[tipo];
  return (
    <div role={tipo === 'info' ? 'note' : 'alert'} className={`rounded-xl border-2 p-3 text-base ${c}`}>
      {children}
    </div>
  );
}

export const AvisoNoOficial = () => (
  <p className="text-center text-sm text-slate-600">Herramienta independiente, no oficial.</p>
);

export const AvisoVerificar = () => <Aviso tipo="alerta">Verificar en Mesa de Entradas antes de presentar.</Aviso>;

export function Campo({
  etiqueta,
  error,
  ayuda,
  children,
}: {
  etiqueta: string;
  error?: string;
  ayuda?: string;
  children: (p: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string; className: string }) => ReactNode;
}) {
  const id = useId();
  const desc = error ? id + 'e' : ayuda ? id + 'a' : undefined;
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-base font-semibold">
        {etiqueta}
      </label>
      {children({ id, 'aria-invalid': !!error, 'aria-describedby': desc, className: 'input' + (error ? ' input-error' : '') })}
      {ayuda && !error && (
        <p id={id + 'a'} className="text-sm text-slate-600">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={id + 'e'} className="text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

/** Panel modal accesible: se cierra con Esc y devuelve el foco. */
export function Modal({ titulo, onCerrar, children }: { titulo: string; onCerrar: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const cerrar = useRef(onCerrar);
  cerrar.current = onCerrar;
  useEffect(() => {
    const previo = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const f = (e: KeyboardEvent) => e.key === 'Escape' && cerrar.current();
    window.addEventListener('keydown', f);
    return () => {
      window.removeEventListener('keydown', f);
      previo?.focus?.();
    };
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 lg:items-center" onClick={onCerrar}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl lg:rounded-3xl"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="text-xl font-bold">{titulo}</h2>
          <button className="btn-sec !min-h-[48px] !px-4" onClick={onCerrar} aria-label="Cerrar">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Confirmar({
  titulo,
  texto,
  accion,
  onConfirmar,
  onCerrar,
}: {
  titulo: string;
  texto: string;
  accion: string;
  onConfirmar: () => void;
  onCerrar: () => void;
}) {
  return (
    <Modal titulo={titulo} onCerrar={onCerrar}>
      <p className="mb-5 text-base">{texto}</p>
      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <button className="btn-peligro" onClick={onConfirmar}>
          {accion}
        </button>
        <button className="btn-sec" onClick={onCerrar}>
          Cancelar
        </button>
      </div>
    </Modal>
  );
}

export function Insignia({ children, color = 'gris' }: { children: ReactNode; color?: 'gris' | 'verde' | 'ambar' }) {
  const c = { gris: 'bg-slate-200 text-slate-800', verde: 'bg-green-100 text-green-900', ambar: 'bg-amber-100 text-amber-900' }[color];
  return <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${c}`}>{children}</span>;
}
