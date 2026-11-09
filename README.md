# Sistema SOS FIRE · Inspección Decameron

App para hacer desde el teléfono la inspección de **detectores de humo**, **alarmas de emergencia** (estaciones manuales) y **lámparas de emergencia**. Reemplaza las hojas impresas y genera el reporte en **Excel** y **PDF** con el mismo formato que se usa hoy.

## Qué hace

- Tres pestañas separadas: Detectores (239), Alarmas (89) y Lámparas (205), tomadas del Excel original.
- Búsqueda rápida sin importar tildes ni mayúsculas: "guardalino 20", "cocina oliva", "145". Con Enter se abre el primer resultado.
- **Búsqueda por edificio y nivel:** "edificio 1 nivel 3" (o "edif 1 n3", "e1 n3") muestra solo ese edificio y ese nivel, más las gradas que llegan a ese nivel. Entiende "Edif.", "Edifc.", "2 nivel" y los números de cuarto (1207 = edificio 1, nivel 2).
- **Agregar equipos que no están en el Excel:** botón **+ Agregar detector / alarma / lámpara**. También aparece al final de una búsqueda sin resultados. El equipo recibe el siguiente N°, se inspecciona en ese momento y queda guardado para las próximas visitas y en los reportes (Excel y PDF, al final de su hoja). Si la ubicación se parece a uno existente, la app lo avisa para no duplicar. Los equipos agregados se pueden eliminar si se agregaron por error.
- **Cambiar nombre:** en cualquier equipo (también los del Excel) el enlace **✎ Cambiar nombre** actualiza la ubicación cuando un área cambia de nombre. Se ve en todos los dispositivos y en los próximos reportes; los reportes anteriores conservan el nombre de su fecha. El nombre viejo se sigue encontrando en la búsqueda, y los equipos del Excel se pueden **volver al nombre original**.
- **Reportes anteriores:** en *Reporte → Reportes anteriores* aparecen las inspecciones por fecha, con filtro por mes. Cada una se puede **ver** (resumen y hallazgos) y **descargar en Excel o PDF**, igual que el día que se hizo.
- **Borrado automático:** se elige cuánto tiempo guardar (1, 2, 3, 6 o 12 meses; por defecto 3). Las inspecciones más viejas que ese plazo se borran solas, como la grabación de las cámaras de seguridad.
- Se marca con ✓ / ✕ / N/A por criterio, con comentarios rápidos. El botón **✓ OK** de la lista guarda un equipo en buen estado con un solo toque.
- Filtros de Pendientes, Con falla y OK, y avance por tipo.
- **Corregir marcas:** los equipos ya marcados muestran **✎ Editar** para cambiar checks y comentarios. Desde *Reporte → Hallazgos* también se toca una falla para corregirla. Cada guardado tiene **Deshacer** por unos segundos, y el equipo queda señalado como "corregido" (la app guarda las últimas 5 versiones).
- Fecha, técnico, encargado y **firmas con el dedo**.
- **Excel:** llena la plantilla original (`assets/plantilla_inspeccion.xlsx`) con logo, colores y las tres hojas.
- **PDF:** página de resumen con los hallazgos y una sección por tipo, con el mismo diseño.
- **Varios técnicos:** cada uno exporta su respaldo (.json) y la encargada los une. Si dos marcaron el mismo equipo, queda la marca más reciente.
- Funciona **sin internet**: los datos se guardan en el teléfono y la app se puede instalar en la pantalla de inicio.
- **Tiempo real entre dispositivos (con Firebase):** lo que marca un técnico aparece al instante en los demás como "✓ OK · Carlos 10:05". Si abren un equipo que otro ya revisó, la app lo avisa. Sin señal se guarda en el teléfono y se envía solo al volver la conexión. "Iniciar nueva inspección" cambia a todos los dispositivos, y la anterior queda guardada en la nube.

> Sin Firebase configurado, la app funciona igual, pero cada dispositivo guarda solo lo suyo (para juntar, se usan los respaldos).

## Estructura

```
src/app.html                  Código de la app (HTML, CSS y JavaScript)
src/cloud.js                  Sincronización en tiempo real (Firebase)
firestore.rules               Reglas de seguridad para Firestore
assets/plantilla_inspeccion.xlsx   Formato Excel original; de aquí sale el listado de equipos
assets/logo.png               Logo SOS FIRE
public/                       Manifest, íconos y service worker (modo app y sin internet)
build.mjs                     Une todo en dist/index.html
render.yaml                   Configuración para Render
```

## Probar en la computadora

Requiere Node.js 18 o más reciente.

```bash
npm install
npm run build      # genera dist/index.html (sin nube)
FIREBASE_CONFIG='{...}' npm run build   # con tiempo real
npm start          # abre http://localhost:3000
```

También se puede abrir `dist/index.html` con doble clic. Funciona igual, solo que sin el modo "instalar app".

## Activar el tiempo real (Firebase)

Se hace una sola vez. Es gratis con el plan Spark de Firebase, que alcanza de sobra para este uso.

1. **Crear el proyecto:** entre a https://console.firebase.google.com con la cuenta de Google de la empresa → **Crear un proyecto** → nombre `sos-fire` → Google Analytics no es necesario → **Crear**.
2. **Registrar la app web:** en la portada del proyecto toque el ícono **`</>`** (Web) → apodo `sistema-sos-fire` → **no** marque Hosting → **Registrar app**. Copie el bloque `const firebaseConfig = { ... }` que aparece (apiKey, authDomain, projectId, …).
3. **Activar el inicio de sesión:** menú **Compilación → Authentication** → **Comenzar** → pestaña **Método de acceso** → **Correo electrónico/contraseña** → Habilitar → Guardar.
4. **Crear los usuarios:** en Authentication → pestaña **Usuarios** → **Agregar usuario**. Puede crear uno para todo el equipo (ej. `tecnicos@sosfire.com`) o uno por técnico. Para quitarle el acceso a alguien, se elimina o se inhabilita aquí.
5. **Crear la base de datos:** menú **Compilación → Firestore Database** → **Crear base de datos** → edición **Standard** si lo pregunta → ubicación `nam5 (United States)` → **modo de producción** → Crear.
6. **Poner las reglas de seguridad:** en Firestore → pestaña **Reglas**, borre lo que hay, pegue el contenido del archivo [`firestore.rules`](firestore.rules) → **Publicar**.
7. **Dominio autorizado:** Authentication → **Configuración** → **Dominios autorizados** → **Agregar dominio** → `sistema-sos-fire.onrender.com` (o el dominio que le dio Render).
8. **Conectar con Render:** en Render abra el sitio → **Environment** → **Add Environment Variable**:
   - Key: `FIREBASE_CONFIG`
   - Value: pegue el bloque del paso 2, tal cual (con o sin `const firebaseConfig =`).
   
   Toque **Save, rebuild, and deploy**. En el registro debe aparecer `Nube: Firebase proyecto "sos-fire"`.

La primera vez que alguien entre, la app crea la inspección en la nube y sube las marcas que ese dispositivo ya tuviera.

### ¿Cuánto espacio usa?

La app no guarda archivos Excel/PDF en la nube: guarda los **datos** de cada inspección (marcas, comentarios, firmas) y genera el Excel y el PDF al momento de descargarlos, idénticos. Así cada inspección ocupa unos **100 KB**. El plan gratuito de Firestore da 1 GiB, es decir, espacio para miles de inspecciones. Guardar los archivos en Firebase Storage exigiría el plan de pago (Blaze).

### Si ya tenía las reglas de la versión anterior

Vuelva a copiar [`firestore.rules`](firestore.rules) en Firestore → Reglas → Publicar. Las nuevas reglas permiten guardar los equipos agregados (`catalogo`) y el plazo de los reportes (`app/config`).

> La configuración web de Firebase (apiKey, etc.) no es secreta: lo que protege los datos son el inicio de sesión y las reglas del paso 6.

## Cambiar el listado de equipos

1. Edite el Excel `assets/plantilla_inspeccion.xlsx`. Respete las hojas `DETECTORES`, `ALARMAS` y `LÁMPARAS`, el N° en la columna A y la ubicación en la columna C, desde la fila 8.
2. Súbalo al repositorio (commit + push). Render vuelve a publicar solo y los teléfonos reciben la versión nueva la próxima vez que abran la app con internet.

## Publicar en Render (Static Site, gratis)

**Opción A – Blueprint (usa `render.yaml`)**
1. Entre a https://dashboard.render.com e inicie sesión con GitHub.
2. Toque **New +** → **Blueprint**.
3. Conecte el repositorio `SISTEMA-SOS-FIRE` y toque **Apply**.

**Opción B – Manual**
1. **New +** → **Static Site** → elija el repositorio `SISTEMA-SOS-FIRE`.
2. Llene así:
   - Name: `sistema-sos-fire`
   - Branch: `main`
   - Build Command: `npm ci && npm run build`
   - Publish Directory: `dist`
3. Toque **Create Static Site** y espere a que diga **Live** (1–3 minutos).

La app queda en una dirección como `https://sistema-sos-fire.onrender.com`.

## Instalar en los teléfonos

- **Android (Chrome):** abra el enlace → menú ⋮ → **Agregar a pantalla principal** / **Instalar app**.
- **iPhone (Safari):** abra el enlace → botón Compartir → **Agregar a inicio**.

Abra la app una vez con internet. Después funciona sin señal.
