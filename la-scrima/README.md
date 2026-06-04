# La Scrima — Barber Shop · Barcelona

Web estatica de una sola pagina para La Scrima.

## Como funciona

Abre `index.html` con doble clic en tu navegador. No necesita servidor, npm ni nada.

## Como editar contenido

Abre `lib/manifest.js` con cualquier editor de texto. Ahi estan todos los datos:
- Nombre, eslogan, direccion, telefono
- Horarios
- Servicios y precios
- Equipo
- Resenas

Guarda el archivo y recarga la pagina.

**Importante:** El contenido principal tambien esta en el HTML directamente (por rendimiento), asi que para cambios permanentes edita tambien `index.html`.

## Como cambiar fotos

Reemplaza los archivos en `assets/` manteniendo los mismos nombres:
- `hero-barbershop.jpg` — foto principal del hero
- `barber-chair.jpg` — foto seccion nosotros
- `barber-detail.jpg`, `barber-cutting.jpg`, `barber-tools.jpg` — fotos adicionales

Formatos recomendados: JPG o WebP, maximo 500KB por imagen.

## Como subir a Hostinger

1. Entra en tu panel de Hostinger
2. Ve a **Archivos → Administrador de archivos**
3. Abre la carpeta `public_html`
4. Sube TODA la carpeta `la-scrima` (o su contenido directamente a `public_html`)
5. Asegurate de que `index.html` quede en la raiz de `public_html`

## Estructura

```
la-scrima/
├── index.html          ← pagina principal
├── css/style.css       ← estilos
├── js/main.js          ← interacciones
├── lib/
│   ├── manifest.js     ← datos editables
│   ├── gsap.min.js     ← animaciones
│   └── ScrollTrigger.min.js
├── assets/
│   ├── *.jpg           ← fotos
│   └── credits.json    ← creditos de fotos
├── .htaccess           ← config servidor Apache
└── README.md           ← este archivo
```

## Creditos de fotos

Las fotos actuales son de Openverse (Creative Commons) como placeholder. Ver `assets/credits.json` para detalles. Reemplazar con fotos propias del local antes de publicar.
