import { useState } from 'react';
import { Aviso } from '../components/ui';

export default function Consentimiento({ onAceptar }: { onAceptar: () => void }) {
  const [ok, setOk] = useState(false);
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-4 px-4 py-6">
      <h1 className="text-2xl font-bold text-marca-900">Licencias Docentes Tucumán</h1>
      <Aviso>Herramienta independiente, no oficial. No pertenece al Gobierno de Tucumán ni al Ministerio de Educación.</Aviso>
      <section className="tarjeta space-y-3 text-base">
        <h2 className="text-lg font-bold">Antes de empezar</h2>
        <p>
          <strong>No hace falta registrarte.</strong> Completás tu parte de licencia y descargás el PDF.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Qué se guarda:</strong> tus datos (nombre, DNI, domicilio, escuela, cargo), las licencias que armes y los certificados que adjuntes.
          </li>
          <li>
            <strong>Dónde:</strong> solo en este dispositivo, dentro del navegador. No se envía nada a ningún servidor ni a ningún sistema del Estado.
          </li>
          <li>
            <strong>Datos de salud:</strong> el motivo es opcional y no hace falta que escribas diagnósticos. Si lo hacés, queda solo en tu dispositivo y lo podés borrar cuando quieras.
          </li>
          <li>
            <strong>Contraseña (opcional):</strong> si la usás en <em>Cuenta</em>, todo se guarda cifrado. Si la perdés, no se puede recuperar.
          </li>
          <li>
            <strong>Si borrás los datos del navegador</strong> o cambiás de celular, perdés lo guardado. Hacé una copia de seguridad desde <em>Cuenta</em>.
          </li>
        </ul>
        <p className="text-sm text-slate-600">
          La información de licencias puede estar desactualizada o incompleta: verificá siempre en Mesa de Entradas antes de presentar.
        </p>
      </section>
      <label className="flex min-h-[48px] items-start gap-3 text-base">
        <input type="checkbox" className="mt-1 h-6 w-6 shrink-0" checked={ok} onChange={(e) => setOk(e.target.checked)} />
        <span>Entendí cómo funciona y quiero usar la herramienta.</span>
      </label>
      <button className="btn-primario" disabled={!ok} onClick={onAceptar}>
        Empezar
      </button>
    </main>
  );
}
