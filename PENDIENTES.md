# Pendientes

## 1. Parte de Licencias
El PDF reproduce la estructura del **“Parte de Licencias” de la Dirección de Novedades Salariales** (sin logos), con los datos del docente en azul y en otra letra (Courier), la firma dibujada sobre “Conformidad del Agente”, un parte por escuela y de 1 a 3 originales.

- **Fuente del modelo:** copia publicada en Scribd (2017); ATEP lo anunció ese año como “nuevo parte de licencia para presentar en la escuela en caso de inasistencia”. Los enlaces oficiales de la Guía de Trámites dan 404 y el SIME no lo publica.
- **Pendiente:** confirmar en una escuela que es el modelo vigente y si lo piden en hoja oficio.

## 2. Cómo se presentan las licencias (investigado)
Según el Decreto 505/14 (MGEyJ), arts. 54 a 57 (texto oficial): toda licencia se pide en el formulario reglamentario ante el superior inmediato; si es previsible, con antelación; si no, dentro de las 24 h (aviso en las 2 primeras horas). La dirección no da curso a partes incompletos y los remite a Mesa de Entradas en 24 h. Con dos o más escuelas, se presenta en la de mayor antigüedad (art. 54 inc. e). El art. 57 fija quién concede cada licencia.
- **Pendiente:** no encontré un sistema digital oficial que reemplace al parte en papel (una nota no oficial lo menciona sin datos). Confirmarlo en una escuela.
- **Pendiente:** algunas escuelas piden varios originales (una publica “3 partes”) y entregar “dentro de 2 días”; el decreto dice 24 horas.

## 3. Verificación del catálogo
**36 de 37 tipos de licencia verificados** contra textos oficiales del repositorio de leyes y decretos de Tucumán (rig.tucuman.gov.ar), guardados en `referencias-oficiales/`:
- Decreto 505/14 (MGEyJ) del 26-3-1996 (texto original escaneado; el art. 32 se leyó sobre la imagen).
- Decreto 500/5 (MEd) del 11-3-2009: arts. 10 inc. c y **38 inc. b** (suplentes: de 15 a 30 días con goce).
- Decreto 1.441/5 (MEd) del 13-8-2020: maternidad, adopción y nacimiento para no gestante.
- Ley 9254 (familiar con discapacidad; derogó la Ley 5.806).

Personal suplente y contratado (art. 38): incisos b, c, e, f y h cargados y verificados. El inc. h (nacimiento: 1 día hábil) no fue modificado por el 1.441/5-2020; la app lo aclara.

**Sin verificar (1):** cargo de mayor jerarquía (art. 33). Lo sustituyó el **Decreto 200/5 del 17-2-1999**, que no está publicado en el repositorio oficial (se probaron todas las variantes de dirección). La app muestra el texto de 1996 y lo que agregan las versiones consolidadas, con el aviso “Verificar en Mesa de Entradas”.

## 4. SESOP
Pasos tomados de la web del SESOP (copias archivadas) y del Parte de Licencias. El **Decreto 1543/1** que cita el parte (código de inasistencia y certificado del centro más cercano, con sello) no está publicado en ningún lado accesible; el requisito queda respaldado por el propio formulario oficial. La app no se conecta con el SESOP.

En las licencias de salud hay **dos casillas de adjuntos: certificado médico y código o constancia del SESOP** (en el paso 4 y después de llenar el parte). En el PDF van detrás de los partes, en ese orden.

## 5. Validación legal
- Avisos “herramienta independiente, no oficial” y “Verificar en Mesa de Entradas”.
- Que el parte reproduzca la estructura del formulario oficial y lleve una firma dibujada.
- Política de privacidad (borrador), consentimiento y datos de salud (el motivo no se imprime).

## 6. Decisiones respecto del pedido original
- Sin registro ni contraseña obligatoria (contraseña opcional).
- Apellido y nombre separados (nombre de archivo por inicial del apellido).
- Varias escuelas (hasta 5) con sus datos del parte; “recordar mis datos” y “recordar mi firma” activados por defecto y desactivables.

## 7. Publicación
GitHub Pages desde `docs/` (compilado localmente, subido por la web). Para actualizar: `npm run build` y subir `dist/` a `docs/`.

## 8. Verificación realizada (30/10/2026, local)
- Vitest: 38 pruebas OK (PDF separados, saldos por año y por tope, situación de revista, antigüedad, art. 51 a–f, guía sin licencias huérfanas).
- Playwright: 5 flujos OK; el de suplente descarga 4 PDF separados y controla sus páginas; otro recorre la guía.
- Falta probar en un celular físico: instalación, cámara y firma con el dedo.

## 9. Función de pago (a decidir)
“Mis disponibles” y la guía funcionan gratis por ahora. Cobrarlas necesita decisión del dueño del proyecto: la app no tiene servidor, así que un cobro real (por ejemplo, Mercado Pago) exige agregar un servicio que reciba el pago y valide el acceso, y eso cambia la regla “no se envía nada a ningún servidor”. Un código de desbloqueo sin servidor se puede copiar.

## 10. Lo que solo se puede cerrar fuera de la app
- Confirmar en una escuela que el modelo del Parte de Licencias sigue vigente.
- Validar con la dirección o el gremio la guía y los topes (son una orientación; los hábiles no descuentan feriados).
- Validación legal de avisos y política de privacidad.
