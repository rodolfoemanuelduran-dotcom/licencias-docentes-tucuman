import { useState, type FormEvent } from 'react';
import { desbloquear } from '../lib/db';
import { Aviso, Campo } from '../components/ui';

export default function Desbloqueo({ onListo }: { onListo: () => void }) {
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [trabajando, setTrabajando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setTrabajando(true);
    setError('');
    try {
      await desbloquear(pass);
      onListo();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setTrabajando(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-4 py-6">
      <h1 className="text-2xl font-bold text-marca-900">Desbloquear</h1>
      <form onSubmit={enviar} className="tarjeta space-y-4">
        <Campo etiqueta="Tu contraseña" error={error}>
          {(p) => <input {...p} type="password" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} autoFocus />}
        </Campo>
        <button className="btn-primario w-full" disabled={!pass || trabajando}>
          {trabajando ? 'Abriendo…' : 'Desbloquear'}
        </button>
      </form>
      <Aviso tipo="alerta">Si olvidaste la contraseña no hay forma de recuperar los datos. Solo podés borrar todo y empezar de cero (o restaurar una copia de seguridad).</Aviso>
    </main>
  );
}
