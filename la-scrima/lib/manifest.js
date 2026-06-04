/* ──────────────────────────────────────────────
   manifest.js — Datos editables de La Scrima
   Edita aquí para cambiar textos, precios, horarios, etc.
   ────────────────────────────────────────────── */
window.__LASCRIMA__ = {
  name: "La Scrima",
  subtitle: "Barber Shop · Barcelona",
  slogan: "El mejor corte de tu vida. Cada vez.",
  kicker: "Barber Shop · Sant Antoni · Barcelona",

  address: "Carrer del Comte Borrell 19, Sant Antoni, Barcelona",
  metro: "Metro Eixample / Sant Antoni",
  phone: "+34 609 13 40 77",
  phoneRaw: "34609134077",
  instagram: "@lascrima",
  instagramUrl: "https://instagram.com/lascrima",
  mapsEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2993.8!2d2.1606!3d41.3785!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12a4a25f1cd2c0e7%3A0x5e7e8f1a2b3c4d5e!2sCarrer%20del%20Comte%20Borrell%2C%2019%2C%2008015%20Barcelona!5e0!3m2!1ses!2ses!4v1700000000000",

  hours: [
    { day: "Lunes",    time: "11:00 – 20:00" },
    { day: "Martes",   time: "11:00 – 20:00" },
    { day: "Miércoles", time: "11:00 – 21:00" },
    { day: "Jueves",   time: "11:00 – 20:00" },
    { day: "Viernes",  time: "11:00 – 20:00" },
    { day: "Sábado",   time: "11:00 – 16:00" },
    { day: "Domingo",  time: "Cerrado" }
  ],

  services: [
    { name: "Corte de pelo",              desc: "Corte personalizado con consulta previa y acabado de detalle.", price: "24" },
    { name: "Corte + barba",              desc: "Servicio completo: corte y perfilado de barba con navaja.", price: "35" },
    { name: "Arreglo de barba",           desc: "Perfilado, recorte y cuidado con productos premium.", price: "18" },
    { name: "Afeitado clásico con navaja", desc: "Ritual de afeitado tradicional con toalla caliente.", price: "28" }
  ],

  team: [
    { name: "Alessio", role: "Barbero · La Scrima", quote: "Every cut is spot on — super consistent and exactly how I want it." },
    { name: "Marcio",  role: "Barbero · La Scrima", quote: "He'll cut your hair as clean as a Lamine Yamal pass." }
  ],

  reviews: [
    { author: "Reseña Google", text: "Alessio has been my go-to barber for well over a year. Every cut is spot on — super consistent and exactly how I want it.", stars: 5 },
    { author: "Reseña Google", text: "Marcio is such a good barber, he'll cut your hair as clean as a Lamine Yamal pass. With him your head is in Barcelona's best hands.", stars: 5 },
    { author: "Reseña Google", text: "La Scrima are true professionals who pay great attention to detail. The team are friendly, welcoming and seriously talented.", stars: 5 },
    { author: "Reseña Google", text: "Best barber I've been to, they know what they're doing.", stars: 5 }
  ]
};
