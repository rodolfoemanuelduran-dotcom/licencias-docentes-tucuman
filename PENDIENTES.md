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
**31 de 33 tipos de licencia verificados** contra textos oficiales del repositorio de leyes y decretos de Tucumán (rig.tucuman.gov.ar), guardados en `referencias-oficiales/`:
- Decreto 505/14 (MGEyJ) del 26-3-1996 (texto original, escaneado con OCR).
- Decreto 500/5 (MEd) del 11-3-2009: arts. 10 inc. c (largo tratamiento y afección crítica) y **38 inc. b** (suplentes: de 15 a 30 días con goce).
- Decreto 1.441/5 (MEd) del 13-8-2020: maternidad (30 + 150 días), adopción (60/75/90) y nacimiento para no gestante (30 días).
- Ley 9254 (familiar con discapacidad; derogó la Ley 5.806).

Correcciones que trajo la verificación: art. 30 (cargo electivo) es **sin goce**; art. 32 obliga a quedarse el **doble** del tiempo; licencia anual en **enero** (período común) o **julio** (período especial); lactancia hasta 240 días salvo prescripción.

**Sin verificar (2):** perfeccionamiento (art. 32: la duración y la antigüedad no se leen bien en el escaneo) y cargo de mayor jerarquía (art. 33: lo modificó el Decreto 200/99, que no conseguí).
- **Pendiente:** conseguir el Decreto 200/5-1999 y confirmar que no haya otras modificatorias posteriores.
- **Pendiente:** el art. 38 inc. h (nacimiento para suplentes: 1 día hábil) no fue actualizado por el 1.441/5-2020; confirmar qué se aplica hoy.

## 4. SESOP
Pasos tomados de la web del SESOP (copias archivadas, porque sus páginas dan error 500) y del Parte de Licencias (Dcto. 1543/1, art. 3). **Pendiente:** conseguir el texto del Decreto 1543/1. La app no se conecta con el SESOP: el código se copia a mano.

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

## 8. Verificación realizada (22/10/2026, local)
- Vitest: 24 pruebas OK (incluye varias escuelas, firma en el PDF, migración de datos viejos, art. 38 b, art. 30).
- Playwright: 4 flujos OK (390 px, 1280 px, sin conexión, y suplente con SESOP + 2 escuelas + firma, que controla 6 páginas en el PDF).
- Falta probar la instalación real y la firma con el dedo en un celular físico.
