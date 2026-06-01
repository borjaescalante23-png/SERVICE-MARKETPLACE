/* ============================================================================
   manifest.js — datos editables de El Ciclista Cocktail Bar
   ============================================================================
   Puedes cambiar cualquier texto, foto o número de aquí abriendo este archivo
   con TextEdit (Mac) o Notepad (Windows). NO toques los nombres entre
   comillas a la izquierda de los dos puntos (eso son las "etiquetas" que
   usa la web). Sólo cambia los valores a la derecha.
   ============================================================================ */
(function () {
  "use strict";

  window.__ELCICLISTA__ = {
    brand: {
      name:        "El Ciclista",
      kind:        "Cocktail bar",
      city:        "Barcelona",
      tagline:     "La noche en primera marcha.",
      kicker:      "Coctelería de autor · Música en directo",
      location:    "Gràcia · Barcelona",
      address:     "Carrer de Mozart, 18",
      addressFull: "Carrer de Mozart, 18 · 08012 Gràcia · Barcelona",
      metro:       "Diagonal · Fontana",
      phone:       "692 80 57 16",
      phoneIntl:   "+34 692 80 57 16",
      whatsapp:    "34692805716",
      instagram:   "@elciclistabar",
      instagramURL:"https://instagram.com/elciclistabar",
      hours:       "20:00 → 02:30",
      hoursLong:   "Cada noche · 20:00 → 02:30 (V-S hasta 03:00)",
      since:       "2015",
      capacity:    "Aforo íntimo",
      reservation: "Reserva recomendada jue–sáb"
    },

    /* 8 cócteles. Cada uno se dibuja en line-art SVG (no foto). El campo
       glass elige el tipo de copa: highball, old_fashioned, martini, rocks,
       flute, coupe. El campo liquid es el color del líquido dentro del
       dibujo. accent colorea la etiqueta y los detalles. */
    cocktails: [
      { id:"pedal",       serie:"Casa",      name:"Pedal",        subtitle:"El arranque de la casa",
        glass:"highball", liquid:"#d4b483", accent:"#C49A3C",
        ingredients:["Gin cítrica","Tónica seca","Piel de limón"],
        description:"Fresco, limpio e inevitable. El cóctel con el que El Ciclista da la bienvenida a la noche. Highball alto, hielo limpio, sin adornos." },
      { id:"rueda-libre", serie:"Casa",      name:"Rueda Libre",  subtitle:"Sin frenos",
        glass:"old_fashioned", liquid:"#7a3e1a", accent:"#8B3A1A",
        ingredients:["Mezcal ahumado","Vermut rojo","Amargo de naranja"],
        description:"El más atrevido de la casa. Mezcal ahumado con vermut rojo y un toque amargo que se queda. Old fashioned, hielo macizo, piel de naranja." },
      { id:"cadena",      serie:"Casa",      name:"Cadena",       subtitle:"El espresso martini de la casa",
        glass:"martini", liquid:"#1c0e08", accent:"#C49A3C",
        ingredients:["Espresso reciente","Vodka","Licor de café"],
        description:"Engranaje perfecto. Café recién hecho y vodka helado, batido hasta la espuma del color del cobre. Para cuando la pista empieza a calentar." },
      { id:"palanca",     serie:"Temporada", name:"Palanca",      subtitle:"Sour de whisky y miel",
        glass:"rocks", liquid:"#c49a3c", accent:"#F2EBDA",
        ingredients:["Whisky","Miel de romero","Limón"],
        description:"Sube suave, baja despacio. El equilibrio entre lo dulce y lo ácido, con el whisky llevando la voz cantante." },
      { id:"tubular",     serie:"Temporada", name:"Tubular",      subtitle:"Spritz de temporada",
        glass:"flute", liquid:"#cc4a26", accent:"#8B3A1A",
        ingredients:["Cava brut","Aperol","Soda"],
        description:"Ligero como una rueda de carbono. Para empezar sin pesar, con el cava seco poniendo la burbuja justa." },
      { id:"faro",        serie:"Temporada", name:"Faro",         subtitle:"Dark & Stormy de autor",
        glass:"highball", liquid:"#4a1f0a", accent:"#C49A3C",
        ingredients:["Ron añejo","Lima","Jengibre fresco"],
        description:"Ilumina el camino de vuelta. Ron añejo, lima exprimida al momento y jengibre fresco. Para los que se quedan al final." },
      { id:"manillar",    serie:"Temporada", name:"Manillar",     subtitle:"Pisco sour de la casa",
        glass:"coupe", liquid:"#d4c97a", accent:"#F2EBDA",
        ingredients:["Pisco peruano","Limón","Clara de huevo"],
        description:"Toma el control. Pisco, limón y espuma de clara. Suave en boca, largo en cabeza." },
      { id:"pinon",       serie:"Temporada", name:"Piñón",        subtitle:"Manhattan de la casa",
        glass:"coupe", liquid:"#3d0f0f", accent:"#8B3A1A",
        ingredients:["Bourbon","Vermut negro","Cereza"],
        description:"El clásico sin concesiones. Bourbon de calidad, vermut negro y una cereza. Para los que saben lo que piden." }
    ],

    sessions: [
      { id:"thu", day:"Jueves",   genre:"Soul & Funk",                 line:"Vinilo y criterio.",       icon:"vinyl", accent:"#C49A3C" },
      { id:"fri", day:"Viernes",  genre:"House selectivo",             line:"La selección de la casa.", icon:"house", accent:"#8B3A1A" },
      { id:"sat", day:"Sábado",   genre:"Disco & Nu-Disco",            line:"Pista llena, pies sueltos.", icon:"disco", accent:"#C49A3C" },
      { id:"sun", day:"Domingo",  genre:"Jazz & electrónica suave",    line:"Para cerrar sin prisa.",    icon:"wave",  accent:"#F2EBDA" }
    ],

    gallery: [
      "assets/img/gallery-01.svg","assets/img/gallery-02.svg","assets/img/gallery-03.svg","assets/img/gallery-04.svg",
      "assets/img/gallery-05.svg","assets/img/gallery-06.svg","assets/img/gallery-07.svg","assets/img/gallery-08.svg",
      "assets/img/gallery-09.svg","assets/img/gallery-10.svg","assets/img/gallery-11.svg","assets/img/gallery-12.svg",
      "assets/img/gallery-13.svg","assets/img/gallery-14.svg","assets/img/gallery-15.svg","assets/img/gallery-16.svg"
    ]
  };
})();
