# Escudos incorporados

Las imágenes SVG se guardan en `src/assets/` y se incorporan como data URL en `src/club-crests.js`. La web y la descarga PNG usan los mismos archivos; no dependen de cargar un escudo desde otra web durante la visita.

- **Boca Juniors:** archivo utilizado por la cabecera de su sitio oficial, consultado el 04/11/2026.
  - Sitio: https://www.bocajuniors.com.ar/
  - Archivo: https://cdn.prod.website-files.com/67d2f0b0dcad350660fe43ac/69bab0e66a03ade52a19c3f1_logo-boca.svg
- **River Plate:** SVG de Club Atlético River Plate disponible en Wikimedia Commons, basado en el brandbook del club.
  - Ficha y procedencia: https://commons.wikimedia.org/wiki/File:Escudo_del_C_A_River_Plate.svg
  - Archivo: https://upload.wikimedia.org/wikipedia/commons/4/43/Club_Atl%C3%A9tico_River_Plate_logo.svg

Los SVG se conservan sin redibujar los emblemas. Se verificó que los archivos no contuvieran scripts, imágenes remotas ni manejadores de eventos antes de incorporarlos.

## Logo y tarjetas verticales

`public/logo.jpg` es la imagen original del negocio. `public/logo-card.png` es una adaptación con fondo transparente para el pie de las tarjetas; `src/story-assets.js` incorpora su versión embebida para la descarga. Los motivos temáticos se dibujan como SVG en `src/story-art.js`.

Las tipografías se sirven localmente desde `public/fonts/`, sin pedidos externos a Google al visitar o descargar:

- Bangers: https://github.com/google/fonts/tree/main/ofl/bangers — licencia OFL-bangers.txt.
- Anton: https://github.com/google/fonts/tree/main/ofl/anton — licencia OFL-anton.txt.
- Barlow Condensed ExtraBold Italic: https://github.com/google/fonts/tree/main/ofl/barlowcondensed — licencia OFL-barlowcondensed.txt.
- DM Sans: https://github.com/google/fonts/tree/main/ofl/dmsans — licencia OFL-dmsans.txt.

Se incluyen los archivos de licencia SIL Open Font License.

## Iconos de compra

- Mercado Libre: [favicon del sitio](https://http2.mlstatic.com/frontend-assets/ui-navigation/5.21.22/mercadolibre/favicon.svg).
- WhatsApp: [icono de Simple Icons](https://cdn.simpleicons.org/whatsapp/ffffff), sobre fondo verde.
