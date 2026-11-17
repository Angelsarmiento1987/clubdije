# Activar la web y el panel /superadmin

La configuración de `el-club-del-dije` ya está incorporada. No se necesita Storage. El catálogo, las visitas y las tarjetas usan Firestore; solo el administrador inicia sesión, con Google.

## 1. Crear la base de datos

En Firebase Console → proyecto el-club-del-dije → Firestore Database → Crear base de datos, si no existe. Elegí `(default)` y modo de producción. No publiques con reglas abiertas ni en modo de prueba.

## 2. Habilitar Google

1. Authentication → Sign-in method → **Google** → Enable. Seleccioná el correo de soporte y guardá.
2. En Authentication → Settings → Authorized domains, agregá `www.elclubdeldije.com.ar`. Para entrar también desde la dirección de GitHub Pages, agregá el host `github.io` de tu cuenta u organización. Escribí solo el dominio, sin `https://` ni rutas.
3. Para probar en tu computadora, agregá `localhost` si no está habilitado.

No habilites correo/contraseña ni usuarios anónimos para esta versión. No se necesita una cuenta de servicio.

## 3. Publicar reglas e índices

Dentro de la carpeta del proyecto:

```sh
npm install
npx firebase login
npx firebase deploy --only firestore:rules,firestore:indexes --project el-club-del-dije
```

Revisá el proyecto indicado antes de confirmar el despliegue. Los índices pueden tardar unos minutos en habilitarse.

También podés copiar el contenido completo de `firestore.rules` a Firestore → Rules → Publish. Para filtrar las tarjetas vencidas necesitás estos tres índices compuestos de `firestore.indexes.json`, con alcance **Collection**:

| Colección | Campo 1 | Campo 2 |
|---|---|---|
| giftInvitations | finalized Ascending | createdAt Ascending |
| giftInvitations | finalized Ascending | finalizedAt Ascending |
| giftTokenAdmin | state Ascending | confirmedAt Ascending |

El CLI crea los índices y las exclusiones de índice para nombres y mensajes. Las reglas incluidas protegen también las visitas y el catálogo publicado desde el panel.

## 4. Dar de alta tu cuenta como superadmin

1. Publicá la web o abrila con `npm start` y entrá a **/superadmin**. En GitHub Pages con subcarpeta, será por ejemplo `/nombre-del-repo/superadmin`.
2. Tocá **Ingresar con Google** y elegí tu cuenta. La primera vez puede indicar que tu cuenta no está habilitada; eso es lo esperado antes de asignar permisos.
3. En Firebase Console → Authentication → Users, buscá la cuenta de Google que acabás de usar y copiá su **UID**.
4. En Firestore → Data, creá la colección `admins`. Creá un documento cuyo **ID sea exactamente ese UID** y un campo **enabled**, de tipo **boolean**, con valor **true**.
5. Volvé a /superadmin e ingresá con Google otra vez.

No se necesita compartir contraseñas por chat. Cualquier Google puede intentar iniciar sesión, pero solo los UID habilitados en `admins` pueden administrar la web. Nadie puede darse permisos desde el código público. Para revocar un administrador, poné `enabled: false` desde la consola.

## 5. Qué tiene el panel

### Resumen

- Visitas registradas desde esta versión.
- Visitas de los últimos 30 días.
- Cantidad de productos y fecha del catálogo.

Una visita es una apertura por sesión de pestaña: recargar esa misma pestaña no suma otra; otra pestaña o sesión puede sumar. No representa personas únicas ni recupera visitas anteriores. Se usa sessionStorage para evitar duplicados y se guarda solo una fecha en Firestore, sin IP, nombre, correo o dispositivo. El acceso a /superadmin no cuenta como visita.

El registro puede subcontar si no hay conexión o el navegador bloquea el almacenamiento. No es un sistema antifraude: un cliente malicioso podría generar eventos falsos. Usalo como indicador de navegación. Cada visita registrada consume una escritura; el catálogo remoto consume lecturas. Las consultas de conteo del administrador usan agregaciones de Firestore.

### Catálogo

La primera versión incluye 143 productos. Desde el panel podés actualizarlo sin recompilar:

1. Abrí el listado del vendedor con el enlace del panel.
2. Desde tu navegador guardá **todas las páginas** del listado como HTML (Ctrl+S). No hace falta subir las carpetas de recursos que el navegador pueda crear.
3. En el panel elegí **Importar páginas de Mercado Libre o catálogo JSON** y seleccioná todos los HTML juntos.
4. Revisá cuántos productos nuevos detectó y sus títulos.
5. Tocá **Publicar catálogo**. Solo se anuncia éxito cuando Firestore confirma el guardado. Los visitantes reciben ese catálogo al abrir la web y las pestañas abiertas reciben la actualización.

También acepta el `src/productos.json` que genera el importador Python incluido. Los precios se descartan. Se conservan los productos previos y las categorías que ya tenían; esta herramienta no elimina automáticamente publicaciones ni representa stock en vivo.

La importación rechaza archivos vacíos o incompletos cuando puede detectar que faltan páginas. Si Mercado Libre cambia el formato, habrá que revisar el importador. La lectura automática directa desde el entorno de desarrollo recibió HTTP 403; por eso no se presenta un botón que prometa obtener todo en un clic desde ML. El importador de archivos es la alternativa operativa sin API ni servidor de scraping.

El catálogo compartido se guarda en `site/catalog`, con un límite de 1000 productos o 800 KB en esta versión. Se combina con el catálogo incluido en el proyecto: para coincidencias se prefieren los datos de la versión con fecha más reciente. La actualización mensual anterior de GitHub queda disponible, pero no es necesaria para publicar desde este panel.

### Tarjetas

- Generar un único código de 10 letras/números por venta, mostrado en dos grupos de cinco para copiarlo al paquete.
- Recuperar y copiar el código o enlace desde el panel cuando lo necesites.
- Ofrecer seis diseños modernos y dos especiales para quinceañeras.
- Ver las últimas 100 emisiones, su referencia de venta, estado y vencimiento.
- Entrar a **Tarjetas con más de 30 días**, tanto desde Resumen como desde Tarjetas. Muestra las tarjetas confirmadas hace más de 30 días. Si ya habías usado la versión anterior de dos códigos, también muestra sus registros vencidos para que puedas limpiarlos.
- Eliminar una tarjeta de forma individual, o eliminar las vencidas mostradas en un grupo, con confirmación dentro del panel.

El filtro consulta vencidas directamente en la base; no se limita a filtrar las últimas 100 tarjetas generales. Muestra hasta 100 tarjetas nuevas vencidas y hasta 100 registros de cada grupo del formato anterior, si existen. Después de borrar, se actualiza la lista; si hay más, podés seguir borrándolas.

**El borrado físico es manual, como pediste. No hay workflow de eliminación automática ni TTL configurado.** El acceso público sí queda bloqueado por las reglas a los 30 días; hasta que las borres, los datos vencidos siguen almacenados. El administrador puede ver esos registros para decidir su eliminación. Las imágenes que los clientes descargaron no se borran.

## 6. Probar la primera tarjeta con un único código

1. En /superadmin → Tarjetas → **Generar código de tarjeta**, agregá una referencia opcional de la venta.
2. Copiá el código de 10 caracteres, que se muestra como `ABCDE-FG234`, o su enlace. Se puede recuperar desde la lista del panel. Incluilo en el paquete con la dirección de tu web y la indicación “Tarjeta virtual de regalo para dedicatorias”.
3. El comprador entra al bloque **Tu tarjeta de regalo** de la landing y usa su único campo **Ingresá tu código**. También puede abrir el enlace que apunta a `#tarjeta=CODIGO`.
4. Si el código está sin usar, el sistema abre el editor. Se elige entre seis modelos modernos y dos para quinceañeras, se escriben los nombres y el mensaje, se revisa y se confirma.
5. La confirmación guarda la dedicatoria y cambia el estado en una única operación atómica. Solo se informa éxito tras la confirmación del servidor.
6. Desde otro celular ingresá **el mismo código**. Ahora se abre la tarjeta terminada, con sobre, fecha de vencimiento y descarga PNG. No permite editarla ni volver a confirmarla.

Los códigos nuevos sin usar permanecen disponibles hasta que se completen o los canceles desde el panel. Los **30 días empiezan al confirmar la dedicatoria**, no cuando generás el código. La fecha exacta se muestra en horario de Argentina. El texto confirmado queda cerrado; no hay registro para los clientes.

Los enlaces antiguos `#editar=...` y `#regalo=...` siguen atendiendo las tarjetas emitidas con la versión anterior. Sus invitaciones conservan el plazo original de 30 días desde la emisión.

El editor no guarda borradores; antes de confirmar, el texto solo está en ese navegador. No cierres la pestaña mientras indica que está guardando. Una segunda confirmación simultánea desde otro dispositivo se rechaza; la primera confirmación válida es la que queda guardada.

Los nombres admiten hasta 60 caracteres y el mensaje hasta 1200 caracteres/24 renglones. Se genera un PNG vertical de 1080 × 1920 px en el dispositivo, sin subirlo a Firebase. Hay 21 diseños por temática: fútbol, quinceañeras, familia, celebraciones, vocaciones, amor y amistad, pasiones y Muy vos. Todos incluyen el logo y @elclubdeldije. Consultá TARJETAS.md y VISTA-DISENOS.png.

## 7. Publicar /superadmin

```sh
npm run build
```

Para GitHub Pages, seguí los pasos de `npm run deploy` en el README. Para otros hostings, publicá todo `dist/` en tu hosting HTTPS.

- La compilación incluye `superadmin/index.html` para que GitHub Pages sirva el panel en `/superadmin/`. Los archivos usan una base calculada para admitir `/superadmin`, `/superadmin/` y repositorios con subcarpetas.
- El enlace a Administración de tarjetas de la web lleva a /superadmin.

Las tarjetas nuevas usan el fragmento `#tarjeta=CODIGO` sobre la URL del catálogo; el estado decide si se abre el editor o el visor. Los enlaces generados desde /superadmin vuelven a la raíz de la web para abrir la tarjeta, no al panel.

## Validación y límites de esta entrega

El SDK ya usa tu `firebaseConfig`. No se inició sesión ni se publicaron reglas en tu proyecto real; ese bloque no concede permisos para configurar tu consola. Tenés que habilitar Google, publicar reglas/índices y dar de alta tu UID.

Se comprobó la compilación y se ejecutaron pruebas contra el emulador oficial de Firestore: emisión solo por admin, confirmación atómica, lectura desde otro cliente, inmutabilidad, rechazo de listados públicos, vencimiento, permisos de catálogo y visitas. Hay pruebas locales de importación, códigos y exportación. La verificación final de Google con tu dominio y la prueba entre celulares se hacen después de activar la cuenta.

Los códigos nuevos usan 10 caracteres aleatorios de un alfabeto de 32 símbolos (50 bits), sin 0, 1, I ni O; se aceptan minúsculas, espacios y guiones al ingresarlos. SHA-256 se usa como identificador, pero no aumenta la entropía del código. Las colisiones se comprueban con una transacción al generar cada código. La referencia de venta y el código recuperable se guardan en una colección visible solo para administradores. Quien tenga un código sin usar puede escribir la dedicatoria; después de confirmarla, el mismo código solo permite verla hasta su vencimiento. La versión directa de Firestore no impone límites de intentos por IP: acortar códigos reduce la dificultad de adivinarlos frente al formato anterior. No se presenta un temporizador del navegador como protección de servidor. Para una campaña de alto tráfico o con riesgo de abuso, añadí un backend con limitación real de intentos o volvé a códigos largos; controlá las cuotas. Nunca abras las reglas para solucionar errores de permisos.

## Si ya habías instalado la entrega anterior

Publicá otra vez **firestore.rules** y **firestore.indexes.json** antes de usar el generador nuevo. Agregan las colecciones giftTokens y giftTokenAdmin y habilitan los 21 modelos. El deploy conserva las reglas de las tarjetas anteriores; no requiere borrar documentos existentes. No se modificaron datos de tu cuenta desde esta sesión.

## Si Google entra pero el panel no aparece

La pantalla distingue el ingreso de Google de la autorización en Firestore. Después de elegir tu cuenta:

- Si falta el documento `admins/TU_UID` con `enabled` booleano en `true`, muestra el correo y el UID de esa cuenta. Podés copiarlo desde la web, habilitarlo en Firebase y tocar **Volver a comprobar permisos**, sin repetir el ingreso de Google.
- Si Firestore rechaza la comprobación, se indica que hay que publicar `firestore.rules` en el proyecto `el-club-del-dije`.
- Si la comprobación de permisos tarda más de 15 segundos, deja de esperar y ofrece reintentar. No concede permisos por un timeout.
- Si la autorización es válida, el panel se abre antes de cargar las estadísticas o las tarjetas. Un índice faltante o una consulta lenta no bloquea el acceso completo al administrador.
- Para usar otro correo, tocá **Usar otra cuenta**. La autorización previa se elimina mientras se comprueba la cuenta nueva.

El registro de administrador debe usar el UID que muestra esa misma sesión de Google; no el correo y no el UID de otro proyecto. El valor de enabled debe ser booleano, no un texto con la palabra true.

## QR para incluir en el paquete e identidad del negocio

En /superadmin → Tarjetas, completá **Dirección pública de la web** con la URL HTTPS publicada y tocá **Guardar dirección pública**. Se conserva en Firestore (`site/business`) para recuperarla desde otros dispositivos. Si estás trabajando en localhost, dejá este campo pendiente hasta tener tu URL publicada; podés generar códigos igual, pero no se entrega un QR del paquete que apunte a localhost. La URL puede incluir una subcarpeta de GitHub Pages.

Al generar un código, aparece su QR y estas opciones:

- **Copiar QR como imagen**: copia un PNG para pegarlo en tu programa de diseño. Requiere que el navegador permita copiar imágenes. Si no lo permite, el panel indica que uses la descarga.
- **Descargar QR PNG**: imagen de 1000 × 1000 px con margen blanco.
- **Descargar tarjeta para el paquete**: etiqueta de 1600 × 1000 px con El Club del Dije, instrucciones, dirección web, @elclubdeldije, el código escrito y el QR.

El QR abre el mismo código en `#tarjeta=...`: sin usar abre el editor, confirmado abre la tarjeta. No necesita una app especial ni un servicio externo de QR. Los QR y las etiquetas se generan en el navegador, sin guardarse en Storage. Desde la lista también podés usar **Ver / descargar QR** para recuperar el QR de una tarjeta ya emitida.

Usá la dirección definitiva antes de imprimir y escaneá una copia de prueba. Cambiar la dirección guardada no modifica los QR que ya imprimiste.

Se agregó el modelo **Club · Neon**, con una composición editorial negra, verde lima y lavanda, nombres y dedicatoria, marca e Instagram. Es el modelo inicial de la landing y del editor. Los otros diseños también incluyen @elclubdeldije en la vista web y en la imagen descargada; en la web el usuario puede abrir el perfil desde ese pie.

**Actualización necesaria:** ejecutá `npm install` para instalar la dependencia de QR y publicá otra vez `firestore.rules`. Las reglas nuevas permiten guardar la dirección pública y usar el modelo Club · Neon; no cambian la autorización del administrador ni borran tarjetas existentes. No se necesita habilitar Storage.

## Diseños de acuerdo con el dije

Se agregaron Boca, River y fútbol general. El selector agrupa los diseños por temática: Para hinchas y futboleros, Para quinceañeras y Para cada historia. Hay 21 modelos en total. Los tres nuevos mantienen el mismo código único, vencimiento, descarga, Instagram y QR del regalo. Publicá las reglas de esta entrega para aceptar `boca`, `river` y `futbol`; no hace falta agregar índices nuevos.

## Actualización: tarjetas verticales

Publicá de nuevo **firestore.rules** para habilitar los 21 identificadores de modelo. No hay cambios de índices en esta entrega. Se conservan los códigos existentes, el acceso sin registro y el plazo de 30 días. La descarga de la dedicatoria ahora es de 1080 × 1920 px; la etiqueta impresa para el paquete mantiene su formato horizontal y su QR. Las fuentes, las ilustraciones y el logo están incluidos en el proyecto.
