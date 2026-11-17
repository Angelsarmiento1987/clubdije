# El Club del Dije — catálogo y tarjetas

## Usar el proyecto

Requiere Node.js 22 o posterior. Dentro de esta carpeta:

```sh
npm install
npm start
```

Abrí http://localhost:3000. El ZIP incluye una compilación en `dist/`. Los enlaces de archivos son relativos y permiten publicar en una subcarpeta de GitHub Pages.

## Publicar en GitHub Pages

1. Guardá y subí estos cambios a la rama predeterminada de tu repositorio, incluido `.github/workflows/catalogo-mensual.yml`.
2. En **Settings → Pages → Build and deployment**, elegí **GitHub Actions** como origen. En **Custom domain**, guardá `www.elclubdeldije.com.ar`.
3. Instalá [GitHub CLI](https://cli.github.com/) si hace falta. En Windows podés usar `winget install --id GitHub.cli` y volver a abrir la terminal. Desde la carpeta de tu repositorio, ejecutá:

   ```sh
   gh auth login
   npm run deploy
   ```

`npm run deploy` inicia el flujo de GitHub Actions para compilar y publicar la última versión subida a la rama predeterminada, con el catálogo incluido en ese commit. Podés ver el resultado en **Actions → Actualizar catálogo y publicar**. Para próximas publicaciones, subí primero tus cambios con Git y volvé a ejecutar `npm run deploy`.

### Conectar el dominio en DonWeb

Si DonWeb administra los nameservers del dominio, entrá a **Mis Servicios → Dominios → Gestionar → Nameservers y Zona DNS**. En la zona DNS, agregá o actualizá estos registros. Si ya hay un registro web para `www` o para la raíz, revisalo antes de agregar uno que entre en conflicto. Conservá los registros de correo.

| Tipo | Nombre | Destino |
| --- | --- | --- |
| CNAME | `www` | `<dueño-del-repo>.github.io` |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |

Reemplazá `<dueño-del-repo>` por el usuario u organización que figura en la URL del repositorio. Usá únicamente el host `github.io` en el destino. Los registros A permiten que GitHub Pages redirija `elclubdeldije.com.ar` a `www.elclubdeldije.com.ar`. Cuando GitHub valide el dominio y emita el certificado, activá **Enforce HTTPS** en **Settings → Pages**. Consultá las guías de [DonWeb](https://soporte.donweb.com/es/articles/15901641-dominios-y-zona-dns-gestionar-la-zona-dns-de-tu-dominio) y [GitHub Pages](https://docs.github.com/es/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

En Firebase Authentication, agregá `www.elclubdeldije.com.ar` a **Authorized domains** para entrar a `/superadmin/` con Google. En **Superadmin → Tarjetas**, guardá `https://www.elclubdeldije.com.ar/` como dirección pública para los nuevos QR.

## Cambios incluidos

- Se conservaron los 143 productos y el diseño original.
- Se quitaron los precios tanto de los datos como de las tarjetas y el selector de orden.
- Cada producto tiene una consulta a WhatsApp al 11 6908-6248 (`5491169086248`), con título y enlace de la publicación incluidos.
- Se mantienen los enlaces de compra en Mercado Libre.
- La cantidad destacada se calcula desde el catálogo.
- Tarjetas con Firebase: panel /superadmin con Google, emisión por venta, un código corto que detecta automáticamente si está sin usar o confirmado, 21 diseños verticales por temática, con dos para quinceañeras, confirmación única, descarga PNG y vencimiento a los 30 días. Para activar tu cuenta y publicar las reglas, seguí CONFIGURAR-FIREBASE.md.

## Actualización mensual preparada para GitHub Pages

El archivo `.github/workflows/catalogo-mensual.yml` intenta actualizar el catálogo y publicar la web el día 1 de cada mes, a las 08:23 de Argentina. Para pedir una actualización manual, entrá a **Actions → Actualizar catálogo y publicar → Run workflow** y elegí `catalogo-y-web`.

**Todavía no está activado ni probado en tu repositorio.** Para activarlo:

1. Subí esta carpeta completa al repositorio (incluida `.github/workflows/`), en su rama predeterminada. No subas `node_modules/`.
2. En Settings → Pages → Build and deployment, elegí GitHub Actions como Source. Este flujo publica `dist/`; no depende de subir el build manualmente.
3. Habilitá Actions y permití que el workflow escriba en el repositorio. Si hay protección de rama que prohíbe el push del bot, ajustá ese permiso o usá un flujo con PR.
4. Ejecutalo manualmente una primera vez para comprobar lectura de Mercado Libre, guardado y publicación. El éxito de esa primera ejecución es el que confirma la integración real.

GitHub puede retrasar los horarios y deshabilitar schedules en repositorios públicos tras 60 días sin actividad. Revisá Actions si deja de ejecutarse. Documentación: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule

### Qué hace y qué limitaciones tiene

`scripts/actualizar_catalogo.py` lee el listado público del vendedor 344979423 y sigue sus páginas. No usa la API de Mercado Libre, no requiere credenciales, no lee precios y no realiza solicitudes desde el navegador de los visitantes.

La lectura real desde el entorno de desarrollo recibió HTTP 403 de Mercado Libre el 03/11/2026. Por eso **no se garantiza que la sincronización funcione desde GitHub**. Un cambio de formato o un bloqueo de ML requerirá revisar el importador. No se intenta eludir bloqueos.

Si hay error de red, una página sin productos, paginación repetida, una publicación incompleta o un recuento menor al informado por el listado, el script falla y deja el JSON intacto. También rechaza una lectura menor a la mitad del catálogo previo. Ese último control es una heurística adicional, no una garantía de integridad cuando ML no informa el total.

La fecha de actualización solo cambia tras completar una importación válida. Los nuevos productos se agregan; los existentes se actualizan sin cambiar sus categorías manuales. **No se eliminan automáticamente publicaciones anteriores**, porque el catálogo no representa stock en vivo. Disponibilidad y variantes se consultan por WhatsApp o en ML.

Si alojás la web fuera de GitHub Pages, ejecutá `npm run build` y subí el contenido de `dist/` a ese hosting. Para automatizarlo, adaptá los pasos de publicación del workflow a tu proveedor.

### Alternativa manual sin API

Desde tu navegador, abrí el listado del vendedor y guardá cada una de sus páginas como HTML. Luego, desde la raíz del proyecto, ejecutá con Python 3.10 o posterior:

```sh
python scripts/actualizar_catalogo.py --html pagina1.html pagina2.html pagina3.html
npm run build
```

Pasá todas las páginas, aunque cambie la cantidad de páginas del listado. El importador admite las estructuras públicas `poly-card` y `ui-search-layout__item`; si el HTML guardado no contiene esas estructuras, falla sin tocar los datos. Los tests usan ejemplos de esas estructuras, no una prueba contra el listado actual de ML. Después subí el catálogo actualizado al repositorio y ejecutá `npm run deploy`.

También podés editar directamente `src/productos.json`: cada producto lleva `id`, `title`, `category`, `image` y `url`; no lleva precio. Cambiá `updatedAt` solo al renovar realmente el catálogo.

## Activar las tarjetas con Firebase

La configuración de la app web `el-club-del-dije` ya está incorporada. Leé **CONFIGURAR-FIREBASE.md**: detalla cómo habilitar Google y dar de alta tu UID como administrador, publicar reglas e índices, emitir la primera tarjeta y eliminar manualmente las tarjetas vencidas desde el panel. No se necesita Storage.

Los códigos funcionan con reglas de Firestore, que hay que publicar antes de usar la versión real. Si ya usabas una entrega anterior, volvé a publicar reglas e índices para habilitar el código único y los 21 diseños. El vencimiento bloquea la lectura a los 30 días; la eliminación de datos se realiza manualmente desde el botón Tarjetas con más de 30 días del panel. No usa el TTL de pago de Firebase.

El panel también incluye visitas registradas y publicación del catálogo a Firestore importando páginas HTML de Mercado Libre o un catálogo JSON. Esa publicación no requiere recompilar la web.

## Validación

- `npm run build` compila la web.
- `python -m unittest discover -s tests` comprueba extracción, paginación, imágenes diferidas, alta/actualización, preservación ante lecturas vacías o incompletas y exclusión de precios.
- No se pudo inspeccionar el diseño en el navegador remoto: ese navegador no pudo conectarse al servidor local de esta sesión. La compilación y la comprobación del HTML renderizado se realizaron localmente.
- Firebase SDK está integrado con tu configuración. No se inició sesión en tu cuenta, desplegaron reglas en producción ni activaron automatizaciones externas.
- `npm test` ejecuta las pruebas de códigos, vencimiento, validación y distribución de texto para la descarga.
- `npm run test:rules` ejecuta pruebas de permisos y flujo atómico con el emulador oficial de Firestore. Requiere Java 17 o posterior con la versión de firebase-tools incluida.

Las imágenes siguen usando los enlaces públicos de ML; si una deja de funcionar se muestra el aviso original. Google Fonts sigue siendo opcional.

## QR e Instagram

El modelo Club · Neon agrega una composición más moderna con la marca e Instagram. Todos los modelos incluyen @elclubdeldije.

En /superadmin → Tarjetas, guardá la URL pública de la web para crear QR del paquete. Al generar un código podés copiar el QR como imagen, descargarlo o descargar una etiqueta completa con marca, instrucciones, URL, código e Instagram. La lista permite recuperar el QR de tarjetas anteriores. Los archivos se crean en el dispositivo, sin Firebase Storage ni servicios externos de QR.

Después de reemplazar el proyecto, ejecutá `npm install` y publicá las reglas actualizadas. Los QR no se preparan con localhost como destino público.

## Tarjetas por temática del regalo

El selector se organiza por intereses: hinchas y futboleros (Boca, River y fútbol general), quinceañeras (Rose y Gala), y diseños generales para otras historias. Los tres modelos de fútbol tienen paletas, adornos y ejemplos de dedicatoria propios. Todos mantienen la marca e Instagram y funcionan en la vista previa, la tarjeta confirmada y el PNG descargado. Publicá las reglas actualizadas para habilitar los tres modelos nuevos.

Los modelos Boca y River muestran sus escudos incorporados, también en la descarga PNG. No dependen de una solicitud externa para mostrar el emblema. Fuentes de los SVG: ASSETS.md.

## Tarjetas verticales para compartir

PNG de 1080 × 1920 px, con dedicatoria, logo e Instagram. Consultá TARJETAS.md y VISTA-DISENOS.png para ver los 21 modelos. Publicá firestore.rules de esta entrega antes de confirmar tarjetas con los modelos nuevos.
