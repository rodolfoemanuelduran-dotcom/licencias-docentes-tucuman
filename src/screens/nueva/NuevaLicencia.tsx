import { useCallback, useEffect, useRef, useState } from 'react';
import type { Contexto } from '../../App';
import { DOCENTE_VACIO, licenciaNueva, type Docente, type Licencia } from '../../types';
import { guardarRegistro, leerRegistro } from '../../lib/db';
import { buscarTipo } from '../../lib/catalogo';
import { imprimirLicencia } from '../../lib/acciones';
import { validarDetalles, validarDocente, validarLicencia, type Errores } from '../../lib/validacion';
import { useAtajos, useEsEscritorio } from '../../hooks/hooks';
import { Aviso } from '../../components/ui';
import { Paso1, Paso2, Paso3, Paso4, Paso5, Paso6 } from './Pasos';
import VistaPreviaPDF from './VistaPreviaPDF';

const TITULOS = ['Tipo de licencia', 'Tus datos', 'Detalles', 'Documentación', 'Revisión', 'Descarga'];

export default function NuevaLicencia({ ctx, id, onDocente }: { ctx: Contexto; id?: string; onDocente: (d: Docente) => void }) {
  const [lic, setLic] = useState<Licencia | null>(null);
  const [errores, setErrores] = useState<Errores>({});
  const [aviso, setAviso] = useState('');
  const tocado = useRef(false);
  const escritorio = useEsEscritorio();

  useEffect(() => {
    (async () => {
      const guardada = id ? await leerRegistro<Licencia>('licencia', id) : undefined;
      if (guardada) setLic(guardada);
      else {
        const perfil = (await leerRegistro<Docente>('docente', 'perfil')) ?? DOCENTE_VACIO;
        setLic({ ...licenciaNueva(perfil), ...(id ? { id } : {}) });
      }
    })();
  }, [id]);

  const guardar = useCallback(
    async (l: Licencia) => {
      const g = { ...l, actualizadaEn: new Date().toISOString() };
      await guardarRegistro('licencia', g.id, g);
      if (g.docente.dni.trim() && g.docente.apellido.trim()) {
        await guardarRegistro('docente', 'perfil', g.docente);
        onDocente(g.docente);
      }
    },
    [onDocente],
  );

  const ultima = useRef<Licencia | null>(null);
  const pendiente = useRef(false);

  // Guardado automático: cada cambio, con una pequeña espera.
  useEffect(() => {
    if (!lic || !tocado.current) return;
    ultima.current = lic;
    pendiente.current = true;
    const t = window.setTimeout(() => {
      pendiente.current = false;
      guardar(lic).catch(() => setAviso('No se pudo guardar el borrador.'));
    }, 400);
    return () => window.clearTimeout(t);
  }, [lic, guardar]);

  // Si se sale de la pantalla (o se oculta la app) con un cambio sin guardar, se guarda en ese momento.
  useEffect(() => {
    const vaciar = () => {
      if (pendiente.current && ultima.current) {
        pendiente.current = false;
        void guardar(ultima.current);
      }
    };
    const oculta = () => document.visibilityState === 'hidden' && vaciar();
    document.addEventListener('visibilitychange', oculta);
    return () => {
      document.removeEventListener('visibilitychange', oculta);
      vaciar();
    };
  }, [guardar]);

  const cambiar = useCallback((p: Partial<Licencia>) => {
    tocado.current = true;
    setLic((l) => (l ? { ...l, ...p } : l));
    setErrores({});
  }, []);

  const guardarYAvisar = useCallback(async () => {
    if (!lic) return;
    tocado.current = true;
    await guardar(lic);
    setAviso('Borrador guardado.');
    window.setTimeout(() => setAviso(''), 2500);
  }, [lic, guardar]);

  useAtajos({
    'ctrl+n': () => (window.location.hash = '#/nueva/' + crypto.randomUUID()),
    'ctrl+s': () => void guardarYAvisar(),
    'ctrl+p': () => lic && Object.keys(validarLicencia(lic, buscarTipo(lic.tipoId))).length === 0 && void imprimirLicencia(lic),
  });

  if (!lic) return <p className="text-base">Cargando…</p>;

  const paso = lic.paso;
  const irAPaso = (n: number) => cambiar({ paso: n });

  function validarPaso(): Errores {
    if (paso === 1) return lic!.tipoId ? {} : { tipoId: 'Elegí un tipo de licencia para seguir.' };
    if (paso === 2) return validarDocente(lic!.docente);
    if (paso === 3) return validarDetalles(lic!);
    if (paso === 5) return validarLicencia(lic!, buscarTipo(lic!.tipoId));
    return {};
  }
  function siguiente() {
    const e = validarPaso();
    if (Object.keys(e).length) return setErrores(e);
    irAPaso(Math.min(6, paso + 1));
    window.scrollTo({ top: 0 });
  }
  const atras = () => {
    irAPaso(Math.max(1, paso - 1));
    window.scrollTo({ top: 0 });
  };

  const props = { lic, cambiar, errores };
  const contenido = (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-slate-600">
          Paso {paso} de 6
        </p>
        <div
          role="progressbar"
          aria-label="Progreso"
          aria-valuemin={1}
          aria-valuemax={6}
          aria-valuenow={paso}
          aria-valuetext={`Paso ${paso} de 6: ${TITULOS[paso - 1]}`}
          className="my-2 h-3 overflow-hidden rounded-full bg-slate-200"
        >
          <div className="h-full bg-marca-600 transition-all" style={{ width: `${(paso / 6) * 100}%` }} />
        </div>
        <h2 className="text-2xl font-bold">{TITULOS[paso - 1]}</h2>
      </div>

      {aviso && <Aviso>{aviso}</Aviso>}

      {paso === 1 && <Paso1 {...props} siguiente={() => setLic((l) => (l ? { ...l, paso: 2 } : l))} />}
      {paso === 2 && <Paso2 {...props} />}
      {paso === 3 && <Paso3 {...props} />}
      {paso === 4 && <Paso4 {...props} />}
      {paso === 5 && <Paso5 lic={lic} irAPaso={irAPaso} />}
      {paso === 6 && <Paso6 lic={lic} alFinal={() => lic.estado !== 'final' && cambiar({ estado: 'final' })} />}

      <div className="flex gap-3 pt-2">
        {paso > 1 && (
          <button className="btn-sec flex-1" onClick={atras}>
            ← Atrás
          </button>
        )}
        {paso < 6 && paso !== 1 && (
          <button className="btn-primario flex-1" onClick={siguiente}>
            {paso === 5 ? 'Generar PDF →' : 'Siguiente →'}
          </button>
        )}
        {paso === 6 && (
          <button className="btn-sec flex-1" onClick={() => ctx.irA('mis')}>
            Ir a Mis licencias
          </button>
        )}
      </div>
      {paso !== 6 && <p className="text-center text-sm text-slate-600">Se guarda solo en este dispositivo a medida que completás.</p>}
    </div>
  );

  if (!escritorio) return <div className="mx-auto max-w-md">{contenido}</div>;
  return (
    <div className="grid grid-cols-2 gap-8">
      <div className="max-w-xl">{contenido}</div>
      <div className="sticky top-6 self-start">
        <VistaPreviaPDF licencia={lic} />
      </div>
    </div>
  );
}
