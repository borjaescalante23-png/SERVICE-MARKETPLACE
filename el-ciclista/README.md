# El Ciclista Cocktail Bar — Web

Web estática (HTML / CSS / JavaScript) lista para subir a Hostinger o cualquier
hosting básico. **Sin instalaciones. Sin terminal. Sin npm.** Te explico todo
en castellano y paso a paso.

---

## 1. Cómo ver la web en tu ordenador

Tienes dos formas:

### A) La fácil (con doble click)

Abre la carpeta `el-ciclista`. Haz **doble click** en el archivo `index.html`.
Se abre en tu navegador (Safari, Chrome, etc.) y ya está.

> Funciona en cualquier ordenador (Mac, Windows, Linux) sin instalar nada.
> Solo el mapa de Google al final puede tardar un par de segundos en cargar.

### B) La fiel (con servidor local — sólo si quieres)

Si quieres ver exactamente como se verá en Internet (con todos los efectos
funcionando al 100% y el mapa de Google sin problemas), abre la Terminal
dentro de la carpeta `el-ciclista` y escribe:

```
python3 -m http.server 8765
```

Luego abre en el navegador: **http://localhost:8765/**

Para parar el servidor: pulsa `Ctrl + C` en la Terminal.

---

## 2. Cómo subirlo a Hostinger

1. Entra en tu cuenta de Hostinger → **Hosting** → tu dominio → **File Manager**.
2. Ve a la carpeta `public_html` (es la raíz pública de tu web).
3. Si hay archivos antiguos (`index.html` viejo, una carpeta de Wix, lo que sea),
   bórralo todo. Empezamos limpio.
4. Arrastra a esa carpeta **todo el contenido** de `el-ciclista/`:
   - `index.html`
   - `styles.css`
   - `main.js`
   - La carpeta `assets/`
   - La carpeta `lib/`
   - El archivo `.htaccess` (importante: empieza por punto, en Mac puede
     estar oculto — activa "ver archivos ocultos" con `Cmd + Shift + .`).
5. Abre tu dominio en el navegador. Listo.

> **Importante**: sube **el contenido** de la carpeta, no la carpeta entera.
> El navegador tiene que ver `index.html` directamente en `public_html/`.

---

## 3. Cómo editar la web tú mismo

Toda la información de la marca (nombre, dirección, teléfono, cócteles, sesiones,
fotos) está en **un solo sitio**: el archivo `lib/manifest.js`.

Ábrelo con **TextEdit** (Mac) o **Notepad** (Windows). Verás bloques así:

```js
brand: {
  name:        "El Ciclista",
  ...
  phone:       "692 80 57 16",
  whatsapp:    "34692805716",
  ...
}
```

Para cambiar el teléfono, modifica `"692 80 57 16"` por el nuevo número.
Para cambiar el número de WhatsApp, modifica `"34692805716"` (sin el `+`).

**Las reglas de oro al editar `manifest.js`:**

1. **No toques los nombres** que están a la izquierda de los dos puntos
   (`name`, `phone`, `tagline`, etc.). Sólo cambia lo que está entre comillas
   a la derecha.
2. **Mantén siempre las comillas dobles** (`"..."`) alrededor del texto.
3. **Mantén la coma** al final de cada línea (excepto la última de cada bloque).
4. Si rompes algo, **abre `lib/manifest.js` en cualquier validador de JSON
   online** (busca "JSON validator" en Google) para ver dónde está el error.
   O pídeme ayuda — me mandas el archivo y te lo arreglo.

### Cambiar los cócteles

Dentro de `lib/manifest.js` busca `cocktails:`. Cada cóctel tiene:

```js
{ id:"pedal", serie:"Casa", name:"Pedal", subtitle:"El arranque de la casa",
  glass:"highball", liquid:"#d4b483", accent:"#C49A3C",
  ingredients:["Gin cítrica","Tónica seca","Piel de limón"],
  description:"Fresco, limpio e inevitable. ..." },
```

- **`name`**: el nombre que sale en grande.
- **`serie`**: "Casa" o "Temporada" (se muestra como etiqueta).
- **`subtitle`**: la frase pequeña debajo del nombre.
- **`glass`**: la copa que se dibuja. Opciones válidas:
  `martini`, `highball`, `old_fashioned`, `rocks`, `flute`, `coupe`.
- **`liquid`**: el color del líquido dentro del dibujo. Es un código hexadecimal
  (empieza por `#`). Puedes usar [coolors.co](https://coolors.co) para elegir uno.
- **`accent`**: el color del acento de la tarjeta (etiqueta, detalles).
  Pega bien con dorado `#C49A3C`, terracota `#8B3A1A` o crema `#F2EBDA`.
- **`ingredients`**: lista de ingredientes. Separados por comas, entre comillas
  cada uno, todos entre corchetes `[ ... ]`.
- **`description`**: el texto largo que cuenta el cóctel.

Para añadir un cóctel nuevo, copia un bloque entero (con su `{` y su `}`) y
pégalo al final de la lista. Acuérdate de poner una coma al final del bloque
anterior.

### Cambiar las sesiones de música

También en `lib/manifest.js`, busca `sessions:`. Mismo método.
Iconos disponibles: `vinyl`, `house`, `disco`, `wave`.

---

## 4. Cómo cambiar las fotos

Las imágenes que ves ahora son **placeholders** (rellenos) en formato SVG.
Son la paleta y el estilo del bar, pero no fotos reales. Cuando tengas
fotos del local, hazlo así:

1. Mete tus fotos en `assets/photos/source/` (cualquier formato: JPG, PNG, HEIC).
2. Para que carguen rápido, **mejor conviértelas a `.webp`** (usa
   [squoosh.app](https://squoosh.app) — arrastra la foto, eliges WebP, descargas).
3. Mete las versiones WebP en `assets/img/` con el nombre exacto del
   placeholder que sustituyen:
   - `hero-bar.svg` → tu foto del ambiente del bar.
   - `local-1.svg`, `local-2.svg`, `local-3.svg` → tres fotos del local.
   - `event-bg.svg` → la foto que pone de fondo en el bloque de eventos privados.
   - `gallery-01.svg` … `gallery-16.svg` → las 16 fotos de la galería que
     desfilan en los tres carriles.
4. **Cambia la extensión en `index.html`**: busca `.svg` y reemplázalo por
   `.webp` solo donde corresponda (las imágenes que cambies). O dímelo y lo
   hago yo en un minuto.

> **Truco**: si no quieres cambiar el `index.html`, conserva el nombre con
> extensión `.svg` pero el archivo debe seguir siendo SVG real. Si lo que tienes
> es JPG/WEBP, **cambia la extensión en el HTML** (es más limpio).

---

## 5. Cambiar el número de WhatsApp

En `lib/manifest.js`, en el bloque `brand`, cambia:

```js
whatsapp:    "34692805716",
```

Pon el nuevo número **sin el `+` ni espacios** (formato internacional).
Por ejemplo, para `+34 600 12 34 56` escribe `"34600123456"`.

Después abre también el `index.html` con TextEdit y busca `wa.me/34692805716`
(aparece 5 o 6 veces). Cámbialo todo por tu nuevo número.
Si te lía, mándame el dato y te lo dejo listo.

---

## 6. Y si algo no se actualiza después de subirlo

Es lo más común: subes el archivo nuevo, recargas la web y sale el antiguo.
Es **caché del navegador**, no es tu error. Soluciones:

### Para verlo tú al instante

- Mac: `Cmd + Shift + R`
- Windows: `Ctrl + F5`

Recarga "dura" — fuerza a bajar lo nuevo.

### Para que todos tus clientes vean lo nuevo

Cuando subas una versión, abre `index.html` con TextEdit y cambia este número:

```
?v=20260601
```

Aparece 4 veces (en CSS y en los `<script>`). Pon la fecha de hoy: por ejemplo,
si subes el 15 de junio de 2026, ponlo `?v=20260615` en los 4 sitios.
Eso obliga al navegador a bajar los archivos nuevos.

> Si te resulta lioso: la web también lleva un `.htaccess` que dice al servidor
> "no caches el HTML ni el CSS ni el JS". Así que normalmente, sólo con el
> Ctrl + F5 tuyo basta y tus clientes ya verán lo nuevo en su siguiente visita.

---

## 7. ¿Qué hay en cada carpeta?

```
el-ciclista/
├── index.html         ← La página. La estructura.
├── styles.css         ← El estilo (colores, tipografías, posiciones).
├── main.js            ← La parte interactiva (cócteles, animaciones).
├── .htaccess          ← Configuración del servidor (caché, MIME types).
├── README.md          ← Esto que estás leyendo.
├── lib/
│   ├── gsap.min.js          ← Librería de animaciones (no toques).
│   ├── ScrollTrigger.min.js ← Idem (no toques).
│   └── manifest.js          ← TUS DATOS. Ábrelo para editar.
├── tools/
│   └── generate_placeholders.py ← Script para regenerar placeholders.
│                                  (No lo necesitas; ignora la carpeta).
└── assets/
    ├── img/                 ← Las imágenes que se muestran en la web.
    ├── photos/source/       ← Aquí METES TUS FOTOS originales.
    └── credits.json         ← Créditos de imágenes.
```

---

## 8. Lo que YA hace la web (resumen rápido)

- Splash de entrada con las letras EL CICLISTA en cascada.
- Hero a pantalla completa, con la foto del local y los CTAs.
- Marquee de neón con los datos clave girando.
- Sección "El local" con collage rotado de fotos y descripción.
- **Los 8 cócteles** en carrusel cinematográfico horizontal (en móvil, swipe
  con el dedo). Cada copa se dibuja a línea cuando entra en pantalla.
- Calendario semanal de música (Jue / Vie / Sáb / Dom).
- Galería de 16 imágenes desfilando en tres carriles a velocidades distintas.
- Bloque grande de eventos privados con CTA directo a WhatsApp.
- Formulario de reserva que **manda los datos a WhatsApp ya formateados**.
- Footer con mapa de Google embebido sobre Mozart 18.
- Cursor personalizado que muestra "reservar", "ver", "escuchar"…
- Responsive: en móvil, todo se reorganiza para verse perfecto.

---

## 9. Si te bloqueas, escríbeme

Cualquier cambio raro, error, "no me sale lo nuevo", "quiero quitar tal sección",
"añade tal cosa", mándame un WhatsApp y te lo dejo.

— Buenas noches en Mozart 18.
