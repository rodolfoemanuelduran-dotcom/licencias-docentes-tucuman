import type { GuiaSesop as Guia } from '../types';

export const SESOP = {
  web: 'https://www.sesop.gov.ar',
  telefonos: [
    { texto: '0800 444 2580', tel: '08004442580' },
    { texto: '0381 421-6009', tel: '03814216009' },
  ],
  direccion: 'Crisóstomo Álvarez 981, San Miguel de Tucumán',
};

export function ContactoSesop() {
  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-3">
        <a className="btn-sec" href={SESOP.web} target="_blank" rel="noopener noreferrer">
          Abrir web del SESOP ↗
        </a>
        {SESOP.telefonos.map((t) => (
          <a key={t.tel} className="btn-sec" href={`tel:${t.tel}`}>
            📞 {t.texto}
          </a>
        ))}
      </div>
      <p className="text-sm text-slate-600">
        Sede central: {SESOP.direccion}. La app no se conecta con el SESOP: el código lo pedís vos en su web o por teléfono y lo copiás acá.
      </p>
    </div>
  );
}

export default function GuiaSesop({ guia, contacto = true }: { guia: Guia; contacto?: boolean }) {
  return (
    <div className="space-y-3">
      <ol className="list-decimal space-y-2 pl-5 text-base">
        {guia.pasos.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ol>
      {contacto && <ContactoSesop />}
      <p className="text-sm text-slate-600">Fuente: {guia.fuente}. Verificá en tu escuela o en el SESOP si hubo cambios.</p>
    </div>
  );
}
