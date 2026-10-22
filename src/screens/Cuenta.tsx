import { useEffect, useState } from 'react';
import type { Contexto } from '../App';
import type { Docente } from '../types';
import {
  activarCifrado,
  borrarTodo,
  cambiarClave,
  desactivarCifrado,
  exportarBackup,
  guardarConfig,
  guardarRegistro,
  importarBackup,
} from '../lib/db';
import { carpetaElegida, carpetaSoportada, elegirCarpeta } from '../lib/archivo';
import FormDocente from '../components/FormDocente';
import { Aviso, Campo, Confirmar, Modal } from '../components/ui';

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="tarjeta space-y-4">
      <h3 className="text-lg font-bold">{titulo}</h3>
      {children}
    </section>
  );
}

export default function Cuenta({ ctx, onDocente, onBloquear }: { ctx: Contexto; onDocente: (d: Docente) => void; onBloquear?: () => void }) {
  const [d, setD] = useState<Docente>(ctx.docente);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [carpeta, setCarpeta] = useState<string | null>(null);
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [pActual, setPActual] = useState('');
  const [trabajando, setTrabajando] = useState(false);
  const [paso, setPaso] = useState<0 | 1 | 2>(0);
  const [confirma, setConfirma] = useState('');
  const [quitar, setQuitar] = useState(false);
  const [backup, setBackup] = useState<'exportar' | 'importar' | null>(null);
  const [bPass, setBPass] = useState('');
  const [bArchivo, setBArchivo] = useState<File | null>(null);

  useEffect(() => {
    carpetaElegida().then(setCarpeta);
  }, []);

  const ok = (m: string) => {
    setMsg(m);
    setError('');
  };
  const fallo = (e: unknown) => {
    setError((e as Error).message || 'Algo salió mal.');
    setMsg('');
  };
  async function correr(f: () => Promise<void>) {
    setTrabajando(true);
    try {
      await f();
    } catch (e) {
      fallo(e);
    } finally {
      setTrabajando(false);
    }
  }

  const guardarDatos = () =>
    correr(async () => {
      await guardarRegistro('docente', 'perfil', d);
      onDocente(d);
      ok('Datos guardados en este dispositivo.');
    });

  const proteger = () =>
    correr(async () => {
      if (p1.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.');
      if (p1 !== p2) throw new Error('Las contraseñas no coinciden.');
      await activarCifrado(p1);
      setP1('');
      setP2('');
      await ctx.recargar();
      ok('Listo: tus datos ahora se guardan cifrados. Anotá la contraseña: si la perdés, no se puede recuperar.');
    });

  const cambiar = () =>
    correr(async () => {
      if (p1.length < 8) throw new Error('La contraseña nueva debe tener al menos 8 caracteres.');
      if (p1 !== p2) throw new Error('Las contraseñas nuevas no coinciden.');
      await cambiarClave(pActual, p1);
      setP1('');
      setP2('');
      setPActual('');
      ok('Contraseña cambiada.');
    });

  const sacarClave = () =>
    correr(async () => {
      await desactivarCifrado();
      setQuitar(false);
      await ctx.recargar();
      ok('Se quitó la contraseña. Tus datos quedan guardados sin cifrar en este dispositivo.');
    });

  const exportar = () =>
    correr(async () => {
      if (bPass.length < 8) throw new Error('Elegí una contraseña de al menos 8 caracteres para la copia.');
      const txt = await exportarBackup(bPass);
      const url = URL.createObjectURL(new Blob([txt], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `copia-licencias-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setBackup(null);
      setBPass('');
      ok('Copia descargada. Guardala en un lugar seguro y no pierdas su contraseña.');
    });

  const importar = () =>
    correr(async () => {
      if (!bArchivo) throw new Error('Elegí el archivo de la copia.');
      const n = await importarBackup(await bArchivo.text(), bPass);
      setBackup(null);
      setBPass('');
      await ctx.recargar();
      ok(`Se restauraron ${n} registros.`);
    });

  const borrar = () =>
    correr(async () => {
      await borrarTodo();
      window.location.hash = '';
      window.location.reload();
    });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h2 className="text-2xl font-bold">Cuenta</h2>
      {msg && <Aviso>{msg}</Aviso>}
      {error && <Aviso tipo="error">{error}</Aviso>}

      <Seccion titulo="Tus datos">
        <FormDocente valor={d} onCambio={setD} />
        <button className="btn-primario w-full" onClick={guardarDatos} disabled={trabajando}>
          Guardar mis datos
        </button>
      </Seccion>

      <Seccion titulo="Carpeta “Mis licencias”">
        {carpetaSoportada() ? (
          <>
            <p className="text-base">
              Los PDF se guardan con el nombre <code>Inicial_Apellido_Nombre_licencia_fecha.pdf</code>, así quedan ordenados por la primera letra del apellido.
              {carpeta ? ` Carpeta actual: “${carpeta}”.` : ' Elegí (o creá) una carpeta llamada “Mis licencias”.'}
            </p>
            <button
              className="btn-sec w-full"
              onClick={() =>
                correr(async () => {
                  const n = await elegirCarpeta();
                  setCarpeta(n);
                  if (n) ok(`Los PDF se guardarán en “${n}”.`);
                }).catch(() => undefined)
              }
            >
              {carpeta ? 'Cambiar carpeta' : 'Elegir carpeta'}
            </button>
          </>
        ) : (
          <p className="text-base">
            Tu navegador no deja elegir una carpeta: los PDF se descargan con el mismo nombre (empieza con la inicial del apellido) a la carpeta de descargas. Después podés moverlos a una carpeta “Mis licencias”.
          </p>
        )}
      </Seccion>

      <Seccion titulo="Seguridad">
        {!ctx.config.cifrado ? (
          <>
            <p className="text-base">Opcional: protegé todo con una contraseña. Los datos se guardan cifrados en tu dispositivo.</p>
            <Aviso tipo="alerta">Si perdés la contraseña, no hay forma de recuperar los datos.</Aviso>
            <Campo etiqueta="Contraseña (mínimo 8 caracteres)">
              {(p) => <input {...p} type="password" autoComplete="new-password" value={p1} onChange={(e) => setP1(e.target.value)} />}
            </Campo>
            <Campo etiqueta="Repetí la contraseña">
              {(p) => <input {...p} type="password" autoComplete="new-password" value={p2} onChange={(e) => setP2(e.target.value)} />}
            </Campo>
            <button className="btn-primario w-full" onClick={proteger} disabled={trabajando || !p1}>
              {trabajando ? 'Cifrando…' : 'Proteger con contraseña'}
            </button>
          </>
        ) : (
          <>
            <p className="text-base">Tus datos están cifrados.</p>
            <Campo etiqueta="Bloqueo automático por inactividad">
              {(p) => (
                <select
                  {...p}
                  value={ctx.config.bloqueoMin}
                  onChange={async (e) => {
                    await guardarConfig({ bloqueoMin: Number(e.target.value) });
                    await ctx.recargar();
                  }}
                >
                  <option value={1}>1 minuto</option>
                  <option value={5}>5 minutos</option>
                  <option value={15}>15 minutos</option>
                  <option value={0}>Nunca</option>
                </select>
              )}
            </Campo>
            {onBloquear && (
              <button className="btn-sec w-full" onClick={onBloquear}>
                Bloquear ahora
              </button>
            )}
            <h4 className="pt-2 text-base font-bold">Cambiar contraseña</h4>
            <Campo etiqueta="Contraseña actual">
              {(p) => <input {...p} type="password" autoComplete="current-password" value={pActual} onChange={(e) => setPActual(e.target.value)} />}
            </Campo>
            <Campo etiqueta="Contraseña nueva (mínimo 8 caracteres)">
              {(p) => <input {...p} type="password" autoComplete="new-password" value={p1} onChange={(e) => setP1(e.target.value)} />}
            </Campo>
            <Campo etiqueta="Repetí la contraseña nueva">
              {(p) => <input {...p} type="password" autoComplete="new-password" value={p2} onChange={(e) => setP2(e.target.value)} />}
            </Campo>
            <button className="btn-primario w-full" onClick={cambiar} disabled={trabajando || !pActual || !p1}>
              Cambiar contraseña
            </button>
            <button className="btn-sec w-full" onClick={() => setQuitar(true)}>
              Quitar la contraseña
            </button>
          </>
        )}
      </Seccion>

      <Seccion titulo="Copia de seguridad">
        <p className="text-base">La copia se cifra con una contraseña que elijas al exportarla. Sirve para pasar tus datos a otro dispositivo.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <button className="btn-sec" onClick={() => setBackup('exportar')}>
            Exportar copia cifrada
          </button>
          <button className="btn-sec" onClick={() => setBackup('importar')}>
            Restaurar una copia
          </button>
        </div>
      </Seccion>

      <Seccion titulo="Privacidad y borrado">
        <button className="btn-sec w-full" onClick={() => ctx.irA('privacidad')}>
          Política de privacidad
        </button>
        <button className="btn-peligro w-full" onClick={() => setPaso(1)}>
          Borrar todos mis datos
        </button>
      </Seccion>

      {quitar && (
        <Confirmar
          titulo="¿Quitar la contraseña?"
          texto="Tus datos van a quedar guardados sin cifrar en este dispositivo."
          accion="Sí, quitarla"
          onConfirmar={sacarClave}
          onCerrar={() => setQuitar(false)}
        />
      )}
      {paso === 1 && (
        <Confirmar
          titulo="¿Borrar todos tus datos?"
          texto="Se eliminan tus datos, todas las licencias y los adjuntos de este dispositivo. No se puede deshacer."
          accion="Continuar"
          onConfirmar={() => setPaso(2)}
          onCerrar={() => setPaso(0)}
        />
      )}
      {paso === 2 && (
        <Modal titulo="Última confirmación" onCerrar={() => setPaso(0)}>
          <div className="space-y-4">
            <Campo etiqueta="Escribí BORRAR para confirmar">
              {(p) => <input {...p} value={confirma} onChange={(e) => setConfirma(e.target.value)} autoCapitalize="characters" />}
            </Campo>
            <button className="btn-peligro w-full" disabled={confirma.trim().toUpperCase() !== 'BORRAR' || trabajando} onClick={borrar}>
              Borrar todo definitivamente
            </button>
            <button className="btn-sec w-full" onClick={() => setPaso(0)}>
              Cancelar
            </button>
          </div>
        </Modal>
      )}
      {backup && (
        <Modal titulo={backup === 'exportar' ? 'Exportar copia cifrada' : 'Restaurar una copia'} onCerrar={() => setBackup(null)}>
          <div className="space-y-4">
            {backup === 'importar' && (
              <Campo etiqueta="Archivo de la copia">
                {(p) => <input {...p} type="file" accept="application/json,.json" onChange={(e) => setBArchivo(e.target.files?.[0] ?? null)} />}
              </Campo>
            )}
            <Campo etiqueta="Contraseña de la copia">
              {(p) => <input {...p} type="password" autoComplete="off" value={bPass} onChange={(e) => setBPass(e.target.value)} />}
            </Campo>
            {error && <Aviso tipo="error">{error}</Aviso>}
            <button className="btn-primario w-full" disabled={trabajando || !bPass} onClick={backup === 'exportar' ? exportar : importar}>
              {backup === 'exportar' ? 'Descargar copia' : 'Restaurar'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
