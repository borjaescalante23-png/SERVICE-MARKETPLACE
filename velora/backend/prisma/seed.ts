import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Velora database...')

  const tutorData = [
    {
      firstName: 'Laura', lastName: 'García', email: 'laura@velora.com',
      headline: 'Inglés conversacional para todos los niveles',
      bio: 'Profesora nativa con 8 años de experiencia. Metodología comunicativa, aprenderás a hablar desde la primera clase.',
      city: 'Madrid', languages: 'Español, Inglés', teachingMode: 'BOTH',
      avgRating: 4.8, totalReviews: 32, completedSessions: 128, isVerified: true,
      classes: [
        { title: 'Inglés conversacional', description: 'Aprende a hablar inglés con fluidez en situaciones cotidianas. Clases dinámicas con material actualizado.', category: 'IDIOMAS', pricePerHour: 20, level: 'ALL', teachingMode: 'BOTH', includes: 'Material didáctico,Grabaciones de clase,Ejercicios personalizados,Seguimiento progreso' },
        { title: 'Inglés para negocios', description: 'Domina el inglés profesional para reuniones, emails y presentaciones corporativas.', category: 'IDIOMAS', pricePerHour: 25, level: 'INTERMEDIATE', teachingMode: 'ONLINE', includes: 'Material profesional,Simulacros de reunión,Vocabulario técnico' }
      ]
    },
    {
      firstName: 'Carlos', lastName: 'Martínez', email: 'carlos@velora.com',
      headline: 'Entrenador personal de tenis · 10 años de experiencia',
      bio: 'Ex jugador profesional. Entreno a jugadores de todos los niveles, desde principiantes hasta competición. Tengo pista propia en Barcelona.',
      city: 'Barcelona', languages: 'Español, Catalán', teachingMode: 'PRESENTIAL',
      avgRating: 4.9, totalReviews: 18, completedSessions: 94, isVerified: true,
      classes: [
        { title: 'Tenis para principiantes', description: 'Aprende los fundamentos del tenis: técnica, golpes básicos y juego táctico. Pista incluida.', category: 'DEPORTES', pricePerHour: 25, level: 'BEGINNER', teachingMode: 'PRESENTIAL', includes: 'Pista de tenis,Pelotas incluidas,Análisis de técnica en vídeo' },
        { title: 'Tenis de competición', description: 'Perfecciona tu juego para torneos. Táctica avanzada, saque y subida a la red.', category: 'DEPORTES', pricePerHour: 35, level: 'ADVANCED', teachingMode: 'PRESENTIAL', includes: 'Análisis táctico,Vídeo análisis,Plan de entrenamiento' }
      ]
    },
    {
      firstName: 'David', lastName: 'Rodríguez', email: 'david@velora.com',
      headline: 'Python · Machine Learning · Desde cero hasta profesional',
      bio: 'Ingeniero de software senior con 12 años en la industria. He ayudado a más de 200 estudiantes a conseguir su primer trabajo en tech.',
      city: 'Online', languages: 'Español, Inglés', teachingMode: 'ONLINE',
      avgRating: 5.0, totalReviews: 21, completedSessions: 87, isVerified: true,
      classes: [
        { title: 'Python para principiantes', description: 'Aprende Python desde cero. Variables, funciones, listas, diccionarios y proyectos reales.', category: 'TECNOLOGIA', pricePerHour: 22, level: 'BEGINNER', teachingMode: 'ONLINE', includes: 'Código fuente de todas las clases,Proyectos prácticos,Soporte por WhatsApp,Certificado de finalización' },
        { title: 'Machine Learning con Python', description: 'Introducción al ML: regresión, clasificación, redes neuronales. Casos reales de la industria.', category: 'TECNOLOGIA', pricePerHour: 30, level: 'INTERMEDIATE', teachingMode: 'ONLINE', includes: 'Notebooks Jupyter,Datasets reales,Proyectos en GitHub' }
      ]
    },
    {
      firstName: 'Ana', lastName: 'Ruiz', email: 'ana@velora.com',
      headline: 'Profesora de piano · Conservatorio Superior de Música',
      bio: 'Pianista clásica titulada por el Real Conservatorio. Doy clases desde nivel iniciación hasta preparación para conservatorio.',
      city: 'Sevilla', languages: 'Español', teachingMode: 'PRESENTIAL',
      avgRating: 4.7, totalReviews: 15, completedSessions: 63, isVerified: true,
      classes: [
        { title: 'Piano · Iniciación', description: 'Aprende a tocar el piano desde cero. Lectura de notas, técnica básica y primeras piezas.', category: 'MUSICA', pricePerHour: 30, level: 'BEGINNER', teachingMode: 'PRESENTIAL', includes: 'Partituras incluidas,Grabaciones de referencia,Plan de estudio personalizado' },
        { title: 'Piano · Preparación conservatorio', description: 'Preparación específica para las pruebas de acceso al conservatorio.', category: 'MUSICA', pricePerHour: 40, level: 'ADVANCED', teachingMode: 'PRESENTIAL', includes: 'Partituras,Simulacros de prueba,Feedback detallado' }
      ]
    },
    {
      firstName: 'Marc', lastName: 'Soler', email: 'marc@velora.com',
      headline: 'Matemáticas, Física y Química · Selectividad y bachillerato',
      bio: 'Ingeniero Industrial con máster en matemáticas aplicadas. 6 años dando clases. Tasa de aprobados del 96% en selectividad.',
      city: 'Barcelona', languages: 'Español, Catalán, Inglés', teachingMode: 'BOTH',
      avgRating: 4.9, totalReviews: 28, completedSessions: 112, isVerified: true,
      classes: [
        { title: 'Matemáticas bachillerato', description: 'Repaso completo de matemáticas de bachillerato. Álgebra, cálculo, estadística y probabilidad.', category: 'ACADEMIA', pricePerHour: 18, level: 'INTERMEDIATE', teachingMode: 'BOTH', includes: 'Apuntes resumidos,Ejercicios resueltos,Simulacros de examen,WhatsApp para dudas' },
        { title: 'Preparación selectividad', description: 'Preparación intensiva para EBAU/EVAU. Todos los temas + exámenes de años anteriores.', category: 'ACADEMIA', pricePerHour: 22, level: 'ADVANCED', teachingMode: 'BOTH', includes: 'Pack exámenes anteriores,Sesiones de revisión,Plan de estudio' }
      ]
    },
    {
      firstName: 'Julia', lastName: 'Ramírez', email: 'julia@velora.com',
      headline: 'Entrenadora personal · Fitness funcional y pérdida de peso',
      bio: 'Graduada en Ciencias del Deporte. Especialista en entrenamiento funcional y nutrición deportiva. Más de 300 clientes satisfechos.',
      city: 'Madrid', languages: 'Español', teachingMode: 'PRESENTIAL',
      avgRating: 5.0, totalReviews: 20, completedSessions: 98, isVerified: true,
      classes: [
        { title: 'Entrenamiento funcional', description: 'Entrena de forma eficiente con tu propio peso corporal. Sin equipamiento necesario.', category: 'DEPORTES', pricePerHour: 25, level: 'ALL', teachingMode: 'PRESENTIAL', includes: 'Plan de entrenamiento,Seguimiento semanal,Nutrición básica,WhatsApp directo' },
        { title: 'Pérdida de peso sostenible', description: 'Programa completo de 12 semanas para transformar tu cuerpo de forma saludable y duradera.', category: 'DEPORTES', pricePerHour: 30, level: 'BEGINNER', teachingMode: 'PRESENTIAL', includes: 'Plan nutricional,Entrenamiento personalizado,Control de progreso' }
      ]
    },
    {
      firstName: 'Sofia', lastName: 'Pérez', email: 'sofia@velora.com',
      headline: 'Francés A1 al B2 · Profesora nativa de París',
      bio: 'Nativa de París, vivo en España desde hace 5 años. Preparo para DELF y DALF. Mi método combina gramática y conversación desde el primer día.',
      city: 'Online', languages: 'Francés, Español, Inglés', teachingMode: 'ONLINE',
      avgRating: 4.8, totalReviews: 24, completedSessions: 96, isVerified: true,
      classes: [
        { title: 'Francés desde cero (A1-A2)', description: 'Empieza a hablar francés desde el primer día. Pronunciación, gramática básica y conversación.', category: 'IDIOMAS', pricePerHour: 22, level: 'BEGINNER', teachingMode: 'ONLINE', includes: 'Material de gramática,Audios de pronunciación,Ejercicios interactivos' },
        { title: 'Preparación DELF B1-B2', description: 'Prepárate para el examen oficial DELF con ejercicios específicos de cada parte.', category: 'IDIOMAS', pricePerHour: 28, level: 'INTERMEDIATE', teachingMode: 'ONLINE', includes: 'Simulacros de examen,Corrección detallada,Material oficial DELF' }
      ]
    },
    {
      firstName: 'Pablo', lastName: 'Torres', email: 'pablo@velora.com',
      headline: 'Diseño gráfico · Adobe Suite · Marca personal',
      bio: 'Diseñador con 10 años en agencias internacionales. Enseño a crear diseños profesionales que comunican y venden.',
      city: 'Online', languages: 'Español, Inglés', teachingMode: 'ONLINE',
      avgRating: 4.6, totalReviews: 12, completedSessions: 48, isVerified: false,
      classes: [
        { title: 'Diseño gráfico desde cero', description: 'Aprende los fundamentos del diseño gráfico: tipografía, color, composición y Adobe Illustrator.', category: 'ARTE', pricePerHour: 28, level: 'BEGINNER', teachingMode: 'ONLINE', includes: 'Archivos fuente de proyectos,Recursos premium,Feedback personalizado' },
        { title: 'Diseño de marca personal', description: 'Crea tu identidad de marca desde cero: logotipo, paleta de color, tipografía y guía de estilo.', category: 'ARTE', pricePerHour: 35, level: 'INTERMEDIATE', teachingMode: 'ONLINE', includes: 'Kit de marca completo,Revisiones ilimitadas,Entrega de archivos finales' }
      ]
    }
  ]

  for (const data of tutorData) {
    const { classes, avgRating, totalReviews, completedSessions, isVerified, headline, bio, city, languages, teachingMode, ...userData } = data
    const hashed = await bcrypt.hash('Tutor1234!', 10)
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: { ...userData, password: hashed }
    })

    const tutor = await prisma.tutorProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, headline, bio, city, languages, teachingMode, avgRating, totalReviews, completedSessions, isVerified }
    })

    for (const cls of classes) {
      const existing = await prisma.tutorClass.findFirst({ where: { tutorId: tutor.id, title: cls.title } })
      if (!existing) {
        await prisma.tutorClass.create({ data: { tutorId: tutor.id, ...cls } })
      }
    }

    for (let day = 1; day <= 5; day++) {
      await prisma.tutorAvailability.upsert({
        where: { tutorId_dayOfWeek: { tutorId: tutor.id, dayOfWeek: day } },
        update: {},
        create: { tutorId: tutor.id, dayOfWeek: day, startTime: '09:00', endTime: '20:00' }
      })
    }
  }

  const studentHash = await bcrypt.hash('Test1234!', 10)
  await prisma.user.upsert({
    where: { email: 'alumno@test.com' },
    update: {},
    create: { email: 'alumno@test.com', password: studentHash, firstName: 'Alumno', lastName: 'Test' }
  })

  const adminHash = await bcrypt.hash('Admin1234!', 10)
  await prisma.user.upsert({
    where: { email: 'admin@velora.com' },
    update: {},
    create: { email: 'admin@velora.com', password: adminHash, firstName: 'Admin', lastName: 'Velora', role: 'ADMIN' }
  })

  console.log('Seed completed!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
