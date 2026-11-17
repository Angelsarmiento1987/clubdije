# Tu tarjeta de regalo

Un bloque de la landing con un único campo de código y el botón **Abrir tarjeta**. El administrador entra con Google en **/superadmin** y genera un código aleatorio de 10 caracteres por venta. Puede copiarlo, recuperarlo desde la lista y enviarlo en el paquete.

- Sin usar: el código abre el editor de dedicatorias.
- Confirmado: el mismo código abre la tarjeta para verla y descargarla, sin permitir cambios.
- Vencido: el acceso público queda bloqueado; el administrador puede borrarlo manualmente desde **Tarjetas con más de 30 días**.

Los clientes no se registran. El plazo de 30 días empieza al confirmar el mensaje. Los códigos nuevos sin usar permanecen disponibles hasta su uso o cancelación manual. Se conserva la atención de códigos y enlaces de la versión anterior.

## Diseños · 21 modelos verticales

Las tarjetas siguen la referencia visual: colores intensos, títulos grandes e inclinados, una ilustración temática y un recuadro crema amplio para la dedicatoria. El logo del negocio y @elclubdeldije aparecen al pie.

| Categoría | Modelos |
|---|---|
| Hinchas y futboleros | Boca con escudo, River con escudo, fútbol general |
| Quinceañeras | Tu era de brillar · 15, Tu noche · XV |
| Familia | Mamá, papá, nacimiento |
| Cumpleaños y logros | Hoy es todo tuyo, Lo lograste |
| Vocaciones | Medicina, docentes, cuidadores |
| Amor y amistad | Me encantás, Mi persona favorita, Elegirnos siempre |
| Pasiones | Música, mascotas, naturaleza, magia |
| Muy vos | El Club del Dije |

El cliente elige por categoría, ve una miniatura y prueba su dedicatoria antes de confirmar. La imagen se descarga como **PNG de 1080 × 1920 píxeles (9:16)**, lista para compartir en historias de Instagram o por WhatsApp. Compartirla se hace desde el dispositivo del cliente.

Se admiten nombres de hasta 60 caracteres y mensajes de hasta 1200 caracteres/24 renglones. El texto se acomoda al recuadro; las dedicatorias breves se leen mejor en una historia. La vista previa usa la misma composición que la descarga. El PNG se genera en el dispositivo: no se sube a Firebase Storage.

La vista conjunta está en **VISTA-DISENOS.png**. Para regenerarla: `node scripts/render-card-previews.mjs` después de `npm install`.

Publicá las reglas actualizadas para que Firestore acepte los 21 modelos. Los códigos y los modelos de las tarjetas anteriores conservan sus identificadores. Los diseños ahora usan la nueva apariencia. El plazo de 30 días y el borrado manual se mantienen.

## Material para el paquete

Desde el panel, guardá la dirección pública de la web y generá el código. Se muestra su QR, que se puede copiar como imagen, descargar como PNG o incluir en una etiqueta completa de marca con instrucciones, el código escrito y @elclubdeldije. Los QR también se recuperan desde la lista de tarjetas.

El diseño Muy vos lleva la identidad del negocio. Todos los diseños incluyen @elclubdeldije en su pie, tanto en la web como en el PNG.

Las tarjetas de Boca y River incluyen sus escudos en las miniaturas, la vista de la web y el PNG descargado. Los archivos están incorporados al proyecto y sus fuentes se detallan en ASSETS.md.
