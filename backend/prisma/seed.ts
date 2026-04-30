import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 10;

// ─── Helpers ────────────────────────────────────────────────────────────────

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function futureDays(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

// ─── Review comments pool ───────────────────────────────────────────────────

const reviewPools: Record<string, string[]> = {
  PLUMBING: [
    'Llegó puntual y resolvió la avería en menos de una hora. El baño volvió a funcionar perfectamente.',
    'Muy profesional. Detectó el problema de raíz y me explicó todo con claridad. Totalmente recomendable.',
    'Excelente trabajo. Dejó todo más limpio de como lo encontró. Repetiré sin duda.',
    'Rápido y eficaz. Me dio presupuesto antes de empezar y lo cumplió al céntimo.',
    'Resolvió una fuga complicada que otros fontaneros no habían conseguido arreglar. 10 de 10.',
    'Buen profesional, aunque tardó un poco más de lo previsto. El resultado final fue perfecto.',
    'Muy atento y trabajador. Arregló el calentador sin dejar rastro. Lo recomiendo a todos mis vecinos.',
  ],
  CLEANING: [
    'La casa quedó impecable. Muy detallista, incluso limpió las ventanas sin que se lo pidiera.',
    'Puntual, eficiente y con una actitud magnífica. Lo contraté para limpieza post-obra y superó mis expectativas.',
    'Excelente servicio. Usó productos de calidad y el olor que dejó en casa era maravilloso.',
    'Muy profesional. Llegó con todo su material y terminó antes del tiempo acordado.',
    'Una limpieza profunda como nunca había visto. Los baños brillaban. Completamente recomendable.',
    'Buen trabajo en general, aunque en algún rincón podría haber sido más minuciosa.',
    'Fantástica. Mi piso parecía nuevo al terminar. Sin duda volveré a contratarla.',
  ],
  ELECTRICIAN: [
    'Resolvió el problema con el cuadro eléctrico en tiempo récord. Muy seguro y profesional.',
    'Instalación de puntos de luz perfecta. Ordenado y con los cables recogidos como si fueran obra de arte.',
    'Detectó una avería que llevaba semanas dándome problemas. Muy recomendable y precio justo.',
    'Puntual, limpio y muy eficaz. Instaló el enchufe de la cocina sin ningún problema.',
    'Gran profesional. Me dio opciones y precios antes de empezar. El trabajo quedó impecable.',
    'Arregló el cortocircuito en minutos. Tiene mucha experiencia y se nota.',
    'Muy buena experiencia. Cortés, rápido y dejó todo perfecto.',
  ],
  GARDENING: [
    'Transformó completamente mi terraza. Tiene un ojo especial para el diseño de jardines.',
    'Podó y cuidó los árboles del jardín dejándolos perfectos. Muy cuidadoso con las plantas.',
    'Excelente trabajo de mantenimiento. Mi jardín nunca había estado tan bonito.',
    'Muy profesional. Me dio consejos sobre qué plantar y cómo cuidarlo. Repetiré.',
    'Rápido, limpio y con buen gusto. La terraza quedó como nueva.',
    'Gran trabajo. Plantó nuevas flores y el resultado es precioso.',
    'Muy recomendable. Lleva el jardín con mucho cariño y se nota en el resultado.',
  ],
  MASSAGE: [
    'Una sesión increíble. Salí completamente relajada y sin tensiones en la espalda.',
    'Muy profesional y con manos mágicas. El masaje fue exactamente lo que necesitaba.',
    'Excelente técnica. Localizó todos los nudos de tensión y los trató perfectamente.',
    'Una hora de puro relax. Ambiente muy tranquilo y profesional. Totalmente recomendable.',
    'El mejor masaje que me han dado. Muy atento a mis necesidades y muy cómodo en casa.',
    'Fantástico. Volveré sin duda. Resolvió mi contractura cervical en una sola sesión.',
    'Técnica excelente y muy buena persona. Lo recomiendo a cualquiera con tensión muscular.',
  ],
  PERSONAL_TRAINER: [
    'En 3 meses he conseguido mis objetivos. Sabe motivar y adapta los entrenamientos perfectamente.',
    'Muy profesional y exigente en el buen sentido. Ves resultados desde la primera semana.',
    'Excelente entrenador. Explica cada ejercicio y corrige la técnica constantemente.',
    'Ha cambiado completamente mi forma de entrenar. Clases muy dinámicas y efectivas.',
    'Lo recomiendo totalmente. Personalizó el plan de entrenamiento a mi nivel y objetivos.',
    'Muy comprometido. Siempre puntual y con ganas de dar el máximo en cada sesión.',
    'Los resultados hablan por sí solos. Perdí 8kg en 2 meses siguiendo su plan.',
  ],
  HAIRDRESSING: [
    'Corte preciso y exactamente lo que pedí. Muy buenas manos y trato excelente.',
    'Fantástico. Fue a domicilio y trabajó como si estuviera en el mejor salón de Barcelona.',
    'Me hizo el peinado para mi boda y quedó perfecto durante toda la noche.',
    'Muy profesional. Llegó con todo el material y el resultado fue espectacular.',
    'Excelente tinte y corte. Duración perfecta y color muy natural.',
    'Lo recomiendo sin duda. Puntual, limpio y con muy buen gusto.',
    'Un lujo tener un profesional así en casa. Mejor que en muchos salones.',
  ],
  HANDYMAN: [
    'Montó todos mis muebles de IKEA en tiempo récord y sin errores. Totalmente recomendable.',
    'Arregló la persiana que llevaba meses rota. Rápido, limpio y precio muy razonable.',
    'Muy manitas. Hizo varios trabajos en casa y todos quedaron perfectos.',
    'Excelente profesional. Detectó el problema y lo arregló sin que tuviera que comprar nada nuevo.',
    'Muy recomendable. Puntual y con mucha experiencia en todo tipo de reparaciones.',
    'Instaló las puertas correderas perfectamente. El trabajo quedó de 10.',
    'Muy buen trabajo. Arregló la cerradura y ajustó todas las puertas de casa.',
  ],
  CHEF: [
    'Cocinó una cena espectacular para 8 personas. Todo delicioso y la presentación de lujo.',
    'Excelente chef. Adaptó el menú a nuestras preferencias y el resultado fue increíble.',
    'Una experiencia gastronómica en casa. Nunca pensé que podría tener un chef privado a ese precio.',
    'Muy profesional. Llegó con todos los ingredientes y dejó la cocina impecable.',
    'La mejor cena que he tenido en años. Los invitados no paraban de preguntar quién había cocinado.',
    'Menú de temporada adaptado a nuestros gustos. Un lujo asequible. Repetiré.',
    'Fantástico chef. La paella fue la mejor que he probado nunca.',
  ],
};

const genericReviews = [
  'Muy buen profesional. Lo recomendaría sin duda a cualquier persona.',
  'Puntual, eficaz y amable. Una experiencia muy positiva.',
  'Gran trabajo. Precio justo y resultado excelente.',
  'Muy satisfecho con el servicio. Volveré a contratarlo.',
  'Profesional de confianza. Todo perfecto desde el primer momento.',
];

function getReview(category: string): string {
  const pool = reviewPools[category] || genericReviews;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Sembrando base de datos...');

  const pass = (p: string) => bcrypt.hash(p, BCRYPT_ROUNDS);

  // ── Admin ──────────────────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'admin@marketplace.com' },
    update: {},
    create: {
      email: 'admin@marketplace.com',
      password: await pass('Admin1234!'),
      firstName: 'Admin',
      lastName: 'Sistema',
      role: 'ADMIN',
      isVerified: true,
    },
  });

  // ── Test client ────────────────────────────────────────────────────────────
  const client1 = await prisma.user.upsert({
    where: { email: 'cliente@test.com' },
    update: {},
    create: {
      email: 'cliente@test.com',
      password: await pass('Client1234!'),
      firstName: 'María',
      lastName: 'García',
      role: 'CLIENT',
      isVerified: true,
      avatarUrl: 'https://i.pravatar.cc/150?u=cliente@test.com',
    },
  });

  // Extra reviewer clients
  const reviewerData = [
    { email: 'joan@test.com',   firstName: 'Joan',    lastName: 'Puig' },
    { email: 'carla@test.com',  firstName: 'Carla',   lastName: 'Rodríguez' },
    { email: 'toni@test.com',   firstName: 'Antoni',  lastName: 'Mas' },
    { email: 'neus@test.com',   firstName: 'Neus',    lastName: 'Pla' },
    { email: 'roberto@test.com',firstName: 'Roberto', lastName: 'Silva' },
    { email: 'marta@test.com',  firstName: 'Marta',   lastName: 'Ferrer' },
    { email: 'pere@test.com',   firstName: 'Pere',    lastName: 'Bosch' },
  ];
  const reviewers: any[] = [client1];
  for (const rd of reviewerData) {
    const u = await prisma.user.upsert({
      where: { email: rd.email },
      update: {},
      create: {
        ...rd,
        password: await pass('Client1234!'),
        role: 'CLIENT',
        isVerified: true,
        avatarUrl: `https://i.pravatar.cc/150?u=${rd.email}`,
      },
    });
    reviewers.push(u);
  }

  // ── Professional definitions ───────────────────────────────────────────────
  const professionals = [
    {
      email: 'profesional@test.com',
      password: 'Pro1234!',
      firstName: 'Carlos',
      lastName: 'López',
      bio: 'Peluquero profesional con más de 10 años de experiencia en eventos y domicilio. Especializado en bodas, comuniones y cortes de tendencia.',
      city: 'Barcelona',
      level: 'PRO',
      avgRating: 4.8,
      totalReviews: 34,
      completedJobs: 52,
      acceptanceRate: 0.95,
      services: [
        { name: 'Corte de Cabello a Domicilio', category: 'HAIRDRESSING', price: 45, duration: 60, description: 'Corte profesional en la comodidad de tu hogar. Incluye lavado y secado.' },
        { name: 'Peinado para Eventos', category: 'HAIRDRESSING', price: 80, duration: 90, description: 'Peinado profesional para bodas, comuniones y eventos especiales.' },
        { name: 'Tinte + Corte', category: 'HAIRDRESSING', price: 90, duration: 120, description: 'Tinte profesional con coloración de larga duración y corte incluido.' },
      ],
      availability: [1,2,3,4,5,6],
      reviewCategory: 'HAIRDRESSING',
    },
    {
      email: 'jordi.martinez@test.com',
      password: 'Pro1234!',
      firstName: 'Jordi',
      lastName: 'Martínez',
      bio: 'Fontanero certificado con 15 años de experiencia en Barcelona. Especialista en reparaciones urgentes, instalaciones y reformas de baños y cocinas.',
      city: 'Barcelona',
      level: 'ELITE',
      avgRating: 4.9,
      totalReviews: 48,
      completedJobs: 76,
      acceptanceRate: 0.97,
      services: [
        { name: 'Reparación Urgente de Averías', category: 'PLUMBING', price: 65, duration: 60, description: 'Atención urgente a fugas, atascos y averías en tuberías. Disponible de lunes a sábado.' },
        { name: 'Instalación de Grifería', category: 'PLUMBING', price: 55, duration: 90, description: 'Instalación y sustitución de grifos, duchas y sanitarios con materiales de calidad.' },
        { name: 'Reforma de Baño', category: 'PLUMBING', price: 350, duration: 480, description: 'Reforma completa de baño: instalación de plato de ducha, inodoro, lavabo y fontanería.' },
      ],
      availability: [1,2,3,4,5,6],
      reviewCategory: 'PLUMBING',
    },
    {
      email: 'ana.garcia@test.com',
      password: 'Pro1234!',
      firstName: 'Ana',
      lastName: 'García',
      bio: 'Especialista en limpieza profesional del hogar y limpieza post-obra. Trabajo con productos ecológicos certificados. Más de 8 años de experiencia.',
      city: 'Barcelona',
      level: 'PRO',
      avgRating: 4.7,
      totalReviews: 29,
      completedJobs: 44,
      acceptanceRate: 0.92,
      services: [
        { name: 'Limpieza General del Hogar', category: 'CLEANING', price: 60, duration: 180, description: 'Limpieza completa de todas las estancias: cocina, baños, salón y dormitorios. Material incluido.' },
        { name: 'Limpieza Post-Obra', category: 'CLEANING', price: 120, duration: 300, description: 'Limpieza profunda tras reformas o mudanzas. Eliminación de polvo, pintura y residuos.' },
        { name: 'Limpieza de Ventanas', category: 'CLEANING', price: 45, duration: 90, description: 'Limpieza interior y exterior de ventanas, cristales y persianas.' },
      ],
      availability: [1,2,3,4,5],
      reviewCategory: 'CLEANING',
    },
    {
      email: 'miquel.ferrer@test.com',
      password: 'Pro1234!',
      firstName: 'Miquel',
      lastName: 'Ferrer',
      bio: 'Electricista industrial y doméstico con 12 años de experiencia. Instalaciones, reparaciones, cuadros eléctricos y domótica. Certificado por el Ministerio.',
      city: 'Barcelona',
      level: 'ELITE',
      avgRating: 4.9,
      totalReviews: 41,
      completedJobs: 68,
      acceptanceRate: 0.96,
      services: [
        { name: 'Reparación Eléctrica', category: 'ELECTRICIAN', price: 70, duration: 60, description: 'Reparación de averías eléctricas, cortocircuitos y fallos en el cuadro eléctrico.' },
        { name: 'Instalación de Puntos de Luz', category: 'ELECTRICIAN', price: 85, duration: 120, description: 'Instalación de enchufes, interruptores, puntos de luz y luminarias LED.' },
        { name: 'Instalación Cuadro Eléctrico', category: 'ELECTRICIAN', price: 250, duration: 240, description: 'Sustitución o ampliación de cuadro eléctrico con todos los diferenciales y protecciones.' },
      ],
      availability: [1,2,3,4,5,6],
      reviewCategory: 'ELECTRICIAN',
    },
    {
      email: 'sofia.pons@test.com',
      password: 'Pro1234!',
      firstName: 'Sofia',
      lastName: 'Pons',
      bio: 'Terapeuta de bienestar con certificación en masaje terapéutico, relajante y deportivo. Más de 9 años de experiencia ayudando a recuperar el equilibrio y aliviar tensiones.',
      city: 'Barcelona',
      level: 'PRO',
      avgRating: 4.8,
      totalReviews: 37,
      completedJobs: 56,
      acceptanceRate: 0.94,
      services: [
        { name: 'Masaje Relajante (60 min)', category: 'MASSAGE', price: 65, duration: 60, description: 'Masaje de cuerpo completo con aceites esenciales. Ideal para aliviar el estrés y la tensión acumulada.' },
        { name: 'Masaje Terapéutico / Deportivo', category: 'MASSAGE', price: 80, duration: 75, description: 'Masaje dirigido a la recuperación muscular, contracturas y lesiones deportivas.' },
        { name: 'Masaje Facial + Cuero Cabelludo', category: 'MASSAGE', price: 45, duration: 45, description: 'Masaje facial drenante y de cuero cabelludo para liberar tensiones y mejorar la circulación.' },
      ],
      availability: [1,2,3,4,5,6],
      reviewCategory: 'MASSAGE',
    },
    {
      email: 'pablo.torres@test.com',
      password: 'Pro1234!',
      firstName: 'Pablo',
      lastName: 'Torres',
      bio: 'Jardinero paisajista con formación universitaria y más de 11 años de experiencia en jardines privados, terrazas y patios de Barcelona. Diseño, mantenimiento y plantación.',
      city: 'Barcelona',
      level: 'PRO',
      avgRating: 4.6,
      totalReviews: 22,
      completedJobs: 34,
      acceptanceRate: 0.91,
      services: [
        { name: 'Mantenimiento de Jardín', category: 'GARDENING', price: 70, duration: 120, description: 'Poda, siega, riego y cuidado general de jardines y terrazas.' },
        { name: 'Diseño y Plantación', category: 'GARDENING', price: 150, duration: 240, description: 'Diseño personalizado e implantación de plantas, arbustos y flores según el espacio.' },
        { name: 'Poda de Árboles', category: 'GARDENING', price: 90, duration: 180, description: 'Poda profesional de árboles y arbustos con técnicas que favorecen su crecimiento y salud.' },
      ],
      availability: [1,2,3,4,5,6],
      reviewCategory: 'GARDENING',
    },
    {
      email: 'laura.vidal@test.com',
      password: 'Pro1234!',
      firstName: 'Laura',
      lastName: 'Vidal',
      bio: 'Entrenadora personal certificada por NSCA con experiencia en pérdida de peso, tonificación y entrenamiento funcional. Clases a domicilio adaptadas a todos los niveles.',
      city: 'Barcelona',
      level: 'PRO',
      avgRating: 4.9,
      totalReviews: 31,
      completedJobs: 48,
      acceptanceRate: 0.96,
      services: [
        { name: 'Entrenamiento Personal (1h)', category: 'PERSONAL_TRAINER', price: 55, duration: 60, description: 'Sesión personalizada de entrenamiento funcional adaptada a tus objetivos y nivel.' },
        { name: 'Plan de Entrenamiento Mensual', category: 'PERSONAL_TRAINER', price: 180, duration: 60, description: 'Cuatro sesiones al mes + plan de nutrición orientativo + seguimiento continuo.' },
        { name: 'Entrenamiento de Rehabilitación', category: 'PERSONAL_TRAINER', price: 65, duration: 60, description: 'Ejercicios terapéuticos para recuperación de lesiones coordinados con fisioterapia.' },
      ],
      availability: [1,2,3,4,5,6],
      reviewCategory: 'PERSONAL_TRAINER',
    },
    {
      email: 'david.soler@test.com',
      password: 'Pro1234!',
      firstName: 'David',
      lastName: 'Soler',
      bio: 'Técnico en reformas y mantenimiento del hogar. Montaje de muebles, reparaciones generales, instalación de puertas y tarimas. Trabajo rápido y sin sorpresas en el precio.',
      city: 'Barcelona',
      level: 'VERIFIED',
      avgRating: 4.5,
      totalReviews: 18,
      completedJobs: 28,
      acceptanceRate: 0.88,
      services: [
        { name: 'Montaje de Muebles', category: 'HANDYMAN', price: 50, duration: 120, description: 'Montaje profesional de muebles de cualquier marca: IKEA, Conforama, Leroy Merlin...' },
        { name: 'Reparaciones del Hogar', category: 'HANDYMAN', price: 60, duration: 90, description: 'Reparación de persianas, puertas, cerraduras, estantes, grifos y pequeñas averías.' },
        { name: 'Instalación de Tarimas y Suelos', category: 'HANDYMAN', price: 200, duration: 480, description: 'Instalación de tarima flotante, parquet y suelos laminados en cualquier estancia.' },
      ],
      availability: [1,2,3,4,5,6],
      reviewCategory: 'HANDYMAN',
    },
    {
      email: 'marcos.ruiz@test.com',
      password: 'Pro1234!',
      firstName: 'Marcos',
      lastName: 'Ruiz',
      bio: 'Chef profesional con formación en el Basque Culinary Center y experiencia en restaurantes con estrella Michelin. Ofrezco experiencias gastronómicas privadas y cenas especiales a domicilio.',
      city: 'Barcelona',
      level: 'ELITE',
      avgRating: 5.0,
      totalReviews: 19,
      completedJobs: 26,
      acceptanceRate: 0.98,
      services: [
        { name: 'Cena Privada (2-4 personas)', category: 'CHEF', price: 120, duration: 180, description: 'Menú degustación de 5 platos con ingredientes de temporada. Maridaje opcional.' },
        { name: 'Cena para Grupos (5-10 personas)', category: 'CHEF', price: 250, duration: 240, description: 'Menú completo para celebraciones y eventos privados. Vajilla y decoración incluidas.' },
        { name: 'Clases de Cocina Privadas', category: 'CHEF', price: 90, duration: 120, description: 'Aprende a cocinar platos de alta cocina con un chef profesional en tu propia cocina.' },
      ],
      availability: [2,3,4,5,6],
      reviewCategory: 'CHEF',
    },
  ];

  // ── Seed each professional ─────────────────────────────────────────────────
  const barcelonaAddresses = [
    'Carrer de Balmes, 78, Barcelona 08008',
    'Avinguda Diagonal, 234, Barcelona 08013',
    'Carrer de Provença, 156, Barcelona 08036',
    'Carrer del Consell de Cent, 320, Barcelona 08007',
    'Passeig de Gràcia, 55, Barcelona 08007',
    'Carrer de Mallorca, 290, Barcelona 08037',
    'Carrer de Muntaner, 102, Barcelona 08036',
    'Carrer de Valencia, 400, Barcelona 08013',
    'Carrer de Corsega, 245, Barcelona 08008',
    'Gran Via de les Corts Catalanes, 510, Barcelona 08011',
  ];

  for (let i = 0; i < professionals.length; i++) {
    const pDef = professionals[i];

    const proUser = await prisma.user.upsert({
      where: { email: pDef.email },
      update: {},
      create: {
        email: pDef.email,
        password: await pass(pDef.password),
        firstName: pDef.firstName,
        lastName: pDef.lastName,
        role: 'PROFESSIONAL',
        isVerified: true,
        avatarUrl: `https://i.pravatar.cc/150?u=${pDef.email}`,
      },
    });

    let profile = await prisma.professionalProfile.findUnique({ where: { userId: proUser.id } });
    if (!profile) {
      profile = await prisma.professionalProfile.create({
        data: {
          userId: proUser.id,
          bio: pDef.bio,
          verificationStatus: 'APPROVED',
          verifiedAt: daysAgo(randomBetween(60, 300)),
          isVisible: true,
          city: pDef.city,
          country: 'ES',
          level: pDef.level,
          avgRating: pDef.avgRating,
          totalReviews: pDef.totalReviews,
          completedJobs: pDef.completedJobs,
          acceptanceRate: pDef.acceptanceRate,
          cancellationRate: 0.02,
          serviceMode: 'PRESENTIAL',
          travelRadius: 15,
        },
      });
    }

    // Services
    const createdServices: any[] = [];
    for (const svc of pDef.services) {
      const existing = await prisma.service.findFirst({
        where: { professionalId: profile.id, name: svc.name },
      });
      if (!existing) {
        const s = await prisma.service.create({
          data: {
            professionalId: profile.id,
            name: svc.name,
            description: svc.description,
            category: svc.category,
            price: svc.price,
            duration: svc.duration,
            isActive: true,
          },
        });
        createdServices.push(s);
      } else {
        createdServices.push(existing);
      }
    }

    // Availability
    for (const dow of pDef.availability) {
      await prisma.availabilitySlot.upsert({
        where: { professionalId_dayOfWeek: { professionalId: profile.id, dayOfWeek: dow } },
        update: {},
        create: {
          professionalId: profile.id,
          dayOfWeek: dow,
          startTime: '09:00',
          endTime: '19:00',
          isAvailable: true,
        },
      });
    }

    // Experience entries (2 per pro)
    const expCount = await prisma.experienceEntry.count({ where: { professionalId: profile.id } });
    if (expCount === 0 && createdServices.length > 0) {
      await prisma.experienceEntry.create({
        data: {
          professionalId: profile.id,
          title: `Trabajo destacado — ${pDef.services[0].name}`,
          description: `Servicio completo realizado con gran satisfacción del cliente. ${pDef.bio.split('.')[0]}.`,
          serviceCategory: pDef.services[0].category,
          approximateDate: 'Enero 2025',
        },
      });
      await prisma.experienceEntry.create({
        data: {
          professionalId: profile.id,
          title: `Proyecto especial en Barcelona`,
          description: 'Trabajo realizado para una familia en el barrio de Gràcia. Resultado excepcional y cliente muy satisfecho.',
          serviceCategory: pDef.services[0].category,
          approximateDate: 'Octubre 2024',
        },
      });
    }

    // Completed bookings + reviews
    const existingReviewCount = await prisma.review.count({
      where: { booking: { professionalId: profile.id } },
    });

    if (existingReviewCount === 0 && createdServices.length > 0) {
      const reviewCount = randomBetween(pDef.totalReviews - 3, pDef.totalReviews);
      const service = createdServices[0];
      const baseAmount = service.price;
      const platformFee = Math.round(baseAmount * 0.15 * 100) / 100;
      const professionalAmount = Math.round((baseAmount - platformFee) * 100) / 100;

      for (let r = 0; r < reviewCount; r++) {
        const reviewer = reviewers[r % reviewers.length];
        const daysBack = randomBetween(5, 280);
        const scheduledDate = daysAgo(daysBack + 1);
        const completedDate = daysAgo(daysBack);

        const booking = await prisma.booking.create({
          data: {
            clientId: reviewer.id,
            professionalId: profile.id,
            serviceId: service.id,
            status: 'COMPLETED',
            paymentStatus: 'RELEASED',
            address: barcelonaAddresses[randomBetween(0, barcelonaAddresses.length - 1)],
            scheduledAt: scheduledDate,
            completedAt: completedDate,
            totalAmount: baseAmount,
            platformFee,
            professionalAmount,
            createdAt: daysAgo(daysBack + 2),
          },
        });

        const ratings = [4, 4, 5, 5, 5]; // skewed positive
        const rating = ratings[Math.floor(Math.random() * ratings.length)];
        await prisma.review.create({
          data: {
            bookingId: booking.id,
            clientId: reviewer.id,
            rating,
            comment: getReview(pDef.reviewCategory),
            isVerified: true,
            createdAt: completedDate,
          },
        });
      }
    }

    console.log(`✅ ${pDef.firstName} ${pDef.lastName} (${pDef.services[0].category})`);
  }

  console.log('\n📋 Credenciales de prueba:');
  console.log('  Admin:         admin@marketplace.com  / Admin1234!');
  console.log('  Cliente:       cliente@test.com        / Client1234!');
  console.log('  Profesional:   profesional@test.com    / Pro1234!');
  console.log('\n  + 9 profesionales adicionales con datos realistas');
}

main().catch(console.error).finally(() => prisma.$disconnect());
