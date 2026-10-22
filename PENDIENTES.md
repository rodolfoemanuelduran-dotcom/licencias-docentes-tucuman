# Pendientes

## 1. Plantilla oficial del PDF
Hoy se genera un “Parte de solicitud de licencia” propio. El formulario oficial (“Formulario de Licencias” / “Formulario de Novedades”) figura en la Guía de Trámites de Tucumán con enlaces a Google Drive que ya no responden (404), por lo que **no pude bajarlo**. Cuando se consiga, reemplazar solo `src/lib/pdf/plantillaParte.ts`.

## 2. Verificar los registros con `"verificado": false`
**Los 29 registros** de `src/data/licencias.json` siguen en `false`.

Intento de verificación (22/10/2026): el portal oficial `leyes.tucuman.gob.ar` respondió “Recurso no encontrado” (o no respondió) para todas las páginas y PDF, así que **no se pudo contrastar con el texto oficial**. Lo que sí se hizo:
- **Corrección de la cita:** la norma es el **Decreto 505/1 (MEd) del 26-3-1996, BO 12-4-1996** (el “505/14” que figuraba antes era un error de las copias). Modificatorias conocidas: 200/5-1999, 500/5-2009 y **1.441/5-2020**.
- **Corrección de contenido:** el Decreto 1.441/5 (13-8-2020) amplió maternidad (180 días para quien gestó; hasta 60 transferibles), adopción y nacimiento. El catálogo tenía los valores de 1996 (maternidad 45+45); se reemplazaron y se marcó que adopción y nacimiento tienen una cantidad vigente sin confirmar.
- **Contraste con una segunda copia no oficial (2014)**, abreviada: coincide en los arts. 6 (30 días, 6 meses), 7, 15, 19 (versión 1996), 37, 39, 40 y 57; agregó la opción de reducir el descanso previo al parto hasta 30 días. No cubre el resto de los artículos.
- **Dudas abiertas:** mes de la licencia anual en escuelas de período especial; efecto de los decretos 500/5-2009 y 1.441/5-2020 sobre lactancia, excedencia y art. 38.

Para cerrar: bajar el texto consolidado del Boletín Oficial o pedirlo en Mesa de Entradas, y pasar cada registro a `true` solo tras leer el artículo.

## 3. Validación legal
- Aviso “herramienta independiente, no oficial” y “Verificar en Mesa de Entradas”.
- Política de privacidad (`src/screens/Privacidad.tsx`, marcada como borrador) y pantalla de consentimiento.
- Tratamiento de datos de salud (el campo “motivo” es opcional y no pide diagnósticos).

## 4. Decisiones que cambié respecto del pedido original
- **Sin registro ni contraseña obligatoria**: la contraseña es opcional (Cuenta → Seguridad). Sin ella, los datos quedan guardados sin cifrar en el dispositivo; el consentimiento lo explica.
- **Apellido y nombre en campos separados**, para poder nombrar los archivos por la inicial del apellido.

## 5. Despliegue
Falta publicar en Netlify o Cloudflare Pages (requiere tu cuenta). Después, repetir Lighthouse sobre la URL final.

## 6. Verificación realizada (22/10/2026, local)
- Vitest: 13 pruebas OK (días, validación, cifrado, base de datos cifrada, PDF).
- Playwright: flujo completo en 390 px y 1280 px, y carga sin conexión: OK.
- Lighthouse sobre la pantalla inicial (consentimiento): Accesibilidad 100, Buenas prácticas 100, SEO 91 → se agregó `robots.txt`. Lighthouse 12 ya no incluye la categoría PWA; la instalabilidad se comprobó con manifest + service worker + prueba sin conexión, pero **conviene probar la instalación real en un Android y un iPhone**.
- No se probó en un iPhone real ni la elección de carpeta (API solo de Chrome/Edge de escritorio).
