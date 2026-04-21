import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando base de datos...');

  const adminPassword = await bcrypt.hash('Admin1234!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@marketplace.com' },
    update: {},
    create: {
      email: 'admin@marketplace.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'Sistema',
      role: 'ADMIN',
      isVerified: true,
    },
  });
  console.log('✅ Admin creado:', admin.email);

  const clientPassword = await bcrypt.hash('Client1234!', 12);
  const client = await prisma.user.upsert({
    where: { email: 'cliente@test.com' },
    update: {},
    create: {
      email: 'cliente@test.com',
      password: clientPassword,
      firstName: 'María',
      lastName: 'García',
      role: 'CLIENT',
      isVerified: true,
    },
  });
  console.log('✅ Cliente creado:', client.email);

  const proPassword = await bcrypt.hash('Pro1234!', 12);
  const proUser = await prisma.user.upsert({
    where: { email: 'profesional@test.com' },
    update: {},
    create: {
      email: 'profesional@test.com',
      password: proPassword,
      firstName: 'Carlos',
      lastName: 'López',
      role: 'PROFESSIONAL',
      isVerified: true,
    },
  });

  let proProfile = await prisma.professionalProfile.findUnique({ where: { userId: proUser.id } });
  if (!proProfile) {
    proProfile = await prisma.professionalProfile.create({
      data: {
        userId: proUser.id,
        bio: 'Peluquero profesional con más de 10 años de experiencia en eventos y domicilio.',
        verificationStatus: 'APPROVED',
        verifiedAt: new Date(),
        isVisible: true,
        avgRating: 4.8,
        totalReviews: 24,
        completedJobs: 38,
        acceptanceRate: 0.96,
        cancellationRate: 0.02,
      },
    });
  }

  await prisma.service.upsert({
    where: { id: 'seed-service-1' },
    update: {},
    create: {
      id: 'seed-service-1',
      professionalId: proProfile.id,
      name: 'Corte de Cabello a Domicilio',
      description: 'Corte profesional en la comodidad de tu hogar. Incluye lavado y secado.',
      category: 'HAIRDRESSING',
      price: 45,
      duration: 60,
    },
  });

  await prisma.service.upsert({
    where: { id: 'seed-service-2' },
    update: {},
    create: {
      id: 'seed-service-2',
      professionalId: proProfile.id,
      name: 'Peinado para Eventos',
      description: 'Peinado profesional para bodas, comuniones y eventos especiales.',
      category: 'HAIRDRESSING',
      price: 80,
      duration: 90,
    },
  });

  console.log('✅ Profesional creado:', proUser.email);
  console.log('\n📋 Credenciales de prueba:');
  console.log('  Admin:       admin@marketplace.com / Admin1234!');
  console.log('  Cliente:     cliente@test.com / Client1234!');
  console.log('  Profesional: profesional@test.com / Pro1234!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
