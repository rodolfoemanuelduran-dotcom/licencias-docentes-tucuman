export default function Privacidad({ volver }: { volver: () => void }) {
  return (
    <article className="mx-auto max-w-2xl space-y-3 text-base">
      <button className="btn-sec" onClick={volver}>
        ← Volver a Cuenta
      </button>
      <h2 className="text-2xl font-bold">Política de privacidad</h2>
      <p className="rounded-xl border-2 border-amber-500 bg-amber-50 p-3 text-sm">
        Borrador pendiente de validación legal. Describe cómo funciona la app hoy.
      </p>
      <h3 className="text-lg font-bold">Quiénes somos</h3>
      <p>Licencias Docentes Tucumán es una herramienta independiente y no oficial. No pertenece al Gobierno de Tucumán ni al Ministerio de Educación y no se conecta con ningún sistema del Estado.</p>
      <h3 className="text-lg font-bold">Qué datos se guardan</h3>
      <p>Nombre, DNI, domicilio, escuela, cargo, fechas, motivo y observaciones de cada licencia, y las fotos o PDF que adjuntes. El motivo es opcional y no hace falta que incluyas diagnósticos.</p>
      <h3 className="text-lg font-bold">Dónde se guardan</h3>
      <p>Únicamente en este dispositivo (almacenamiento del navegador). La app no envía datos a ningún servidor, no usa analítica y no carga scripts de terceros. Funciona sin conexión.</p>
      <h3 className="text-lg font-bold">Cifrado</h3>
      <p>Podés proteger todo con una contraseña (Cuenta → Proteger con contraseña). Se usa AES-GCM con una clave derivada con PBKDF2 (600.000 iteraciones). Si perdés la contraseña, los datos no se pueden recuperar.</p>
      <h3 className="text-lg font-bold">Tus derechos</h3>
      <p>Podés ver, descargar, duplicar y eliminar cada licencia, y borrar todos los datos desde Cuenta en cualquier momento. Los PDF que descargues o guardes en tu carpeta quedan fuera de la app: cuidalos vos.</p>
      <h3 className="text-lg font-bold">Compartir</h3>
      <p>Cuando tocás “Compartir”, el PDF se entrega a la aplicación que elijas (por ejemplo, WhatsApp o correo). Desde ese momento rigen las condiciones de esa aplicación.</p>
    </article>
  );
}
