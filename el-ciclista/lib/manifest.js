/* ============================================================================
   manifest.js — datos editables de El Ciclista Cocktail Bar
   ============================================================================
   Edítalo con TextEdit (Mac) o Notepad (Windows). Sólo cambia lo que está
   entre comillas a la derecha de los dos puntos. Mantén siempre las comas
   y los corchetes en su sitio.
   ============================================================================ */
(function () {
  "use strict";

  window.__ELCICLISTA__ = {
    brand: {
      name:        "El Ciclista",
      kind:        "Cocktail bar",
      city:        "Barcelona",
      tagline:     "La noche en primera marcha.",
      kicker:      "Coctelería de autor · Gin tonics del pelotón",
      location:    "Gràcia · Barcelona",
      address:     "Carrer de Mozart, 18",
      addressFull: "Carrer de Mozart, 18 · 08012 Gràcia · Barcelona",
      metro:       "Diagonal · Fontana",
      phone:       "692 80 57 16",
      phoneIntl:   "+34 692 80 57 16",
      whatsapp:    "34692805716",
      instagram:   "@elciclistabcn",
      instagramURL:"https://www.instagram.com/elciclistabcn/",
      email:       "ciclistagracia@gmail.com",
      since:       "2015",
      owners:      "Fernando Oviedo & Santi Mosquera",
      capacity:    "Aforo íntimo",
      reservation: "Reserva recomendada jue–sáb",
      menuURL:     "https://www.elciclista-bar.com/menus",
      siteURL:     "https://www.elciclista-bar.com/es"
    },

    /* Horario real (panel de Google):
       Cerrado lun y mar. Mié–jue–dom hasta 02:00, vie y sáb hasta 03:00. */
    hours: [
      { day:"Lunes",     range:"Cerrado",      closed:true },
      { day:"Martes",    range:"Cerrado",      closed:true },
      { day:"Miércoles", range:"20:00 → 02:00" },
      { day:"Jueves",    range:"20:00 → 02:00" },
      { day:"Viernes",   range:"20:00 → 03:00", late:true },
      { day:"Sábado",    range:"20:00 → 03:00", late:true },
      { day:"Domingo",   range:"20:00 → 02:00" }
    ],

    /* La carta vive en su web. Aquí solo el concepto y la puerta. */
    carta: {
      eyebrow: "La carta",
      heading: "Más de veinte gin tonics con nombres del pelotón.",
      lead:    "El sello de la casa: una lista larga de gin tonics de autor bautizados con guiños al ciclismo y a sus héroes. Acompañando, los clásicos sin concesiones — Old Fashioned, Negroni, Mojito, Pisco Sour — vermuts de barrio y la Moritz Epidor de tipo.",
      hints:   ["Anti Doping", "Fixed Sprocket", "Más de 20 gin tonics", "Clásicos de coctelería", "Long drinks desde 5€"],
      ctaLabel:"Ver la carta completa",
      ctaURL:  "https://www.elciclista-bar.com/menus",
      footnote:"La carta cambia con la temporada y con lo que entra en barra. Lo más fiable: preguntar al bartender."
    },

    /* Música — sesiones cuidadas, vinilo, volumen para hablar. */
    sessions: [
      { id:"thu", day:"Jueves",   genre:"Soul & Funk",              line:"Vinilo y criterio.",         icon:"vinyl", accent:"#D8B458" },
      { id:"fri", day:"Viernes",  genre:"House selectivo",          line:"La selección de la casa.",   icon:"house", accent:"#A24521" },
      { id:"sat", day:"Sábado",   genre:"Disco & Nu-Disco",         line:"Pista llena, pies sueltos.", icon:"disco", accent:"#D8B458" },
      { id:"sun", day:"Domingo",  genre:"Jazz & electrónica suave", line:"Para cerrar sin prisa.",     icon:"wave",  accent:"#F2EBDA" }
    ],

    /* Detalles del local — entran en el grid editorial. */
    details: [
      { tag:"Mesas",      title:"Ruedas de bicicleta",  copy:"Mesas hechas con ruedas recicladas. Beber sobre los radios.", art:"wheel" },
      { tag:"Manillares", title:"Pomos y reposavasos",  copy:"Manillares como pomos y radios sosteniendo la copa.",         art:"handlebar" },
      { tag:"DJ booth",   title:"Semáforo y vinilo",    copy:"Un semáforo de calle preside la cabina. Verde para bailar.",  art:"trafficlight" },
      { tag:"Paredes",    title:"Bicis de coleccionista",copy:"Bicis colgadas como Picassos. Cuadros con historia.",         art:"bike" },
      { tag:"Barra",      title:"Latón y madera oscura",copy:"Latón, madera vieja, luz baja. Para hablar a media voz.",     art:"counter" },
      { tag:"Concepto",   title:"Minimalismo romántico",copy:"Fernando Oviedo y Santi Mosquera lo abrieron en 2015.",       art:"frame" }
    ]
  };
})();
