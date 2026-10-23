import { useCallback, useEffect, useState } from 'react';
import { bloquear, guardarConfig, leerConfig, leerRegistro, type Config } from './lib/db';
import { DOCENTE_VACIO, normalizarDocente, type Docente } from './types';
import { useInactividad, useRuta } from './hooks/hooks';
import Shell from './components/Shell';
import Consentimiento from './screens/Consentimiento';
import Desbloqueo from './screens/Desbloqueo';
import Inicio from './screens/Inicio';
import Informacion from './screens/Informacion';
import MisLicencias from './screens/MisLicencias';
import Cuenta from './screens/Cuenta';
import Privacidad from './screens/Privacidad';
import NuevaLicencia from './screens/nueva/NuevaLicencia';

export interface Contexto {
  config: Config;
  recargar: () => Promise<void>;
  docente: Docente;
  irA: (r: string) => void;
}

export default function App() {
  const [config, setConfig] = useState<Config | null>(null);
  const [bloqueada, setBloqueada] = useState(false);
  const [docente, setDocente] = useState<Docente>(DOCENTE_VACIO);
  const [ruta, irA] = useRuta();

  const recargar = useCallback(async () => {
    const c = await leerConfig();
    setConfig(c);
    if (!c.cifrado) {
      setDocente(normalizarDocente(await leerRegistro<Docente>('docente', 'perfil')));
    }
  }, []);

  useEffect(() => {
    recargar().then(async () => {
      const c = await leerConfig();
      setBloqueada(c.cifrado);
    });
  }, [recargar]);

  const bloquearAhora = useCallback(() => {
    bloquear();
    setBloqueada(true);
  }, []);
  useInactividad(config?.bloqueoMin ?? 0, !!config?.cifrado && !bloqueada, bloquearAhora);

  if (!config) return <p className="p-6 text-center text-base">Cargando…</p>;

  if (!config.consentimiento) {
    return (
      <Consentimiento
        onAceptar={async () => {
          await guardarConfig({ consentimiento: true });
          await recargar();
        }}
      />
    );
  }

  if (config.cifrado && bloqueada) {
    return (
      <Desbloqueo
        onListo={async () => {
          setBloqueada(false);
          setDocente(normalizarDocente(await leerRegistro<Docente>('docente', 'perfil')));
        }}
      />
    );
  }

  const ctx: Contexto = { config, recargar, docente, irA };
  const [seccion = 'inicio', param] = ruta;

  let pantalla;
  switch (seccion) {
    case 'nueva':
      pantalla = <NuevaLicencia key={param ?? 'nueva'} ctx={ctx} id={param} onDocente={setDocente} />;
      break;
    case 'mis':
      pantalla = <MisLicencias ctx={ctx} />;
      break;
    case 'info':
      pantalla = <Informacion />;
      break;
    case 'cuenta':
      pantalla = <Cuenta ctx={ctx} onDocente={setDocente} onBloquear={config.cifrado ? bloquearAhora : undefined} />;
      break;
    case 'privacidad':
      pantalla = <Privacidad volver={() => irA('cuenta')} />;
      break;
    default:
      pantalla = <Inicio ctx={ctx} />;
  }

  return (
    <Shell seccion={seccion} irA={irA}>
      {pantalla}
    </Shell>
  );
}
