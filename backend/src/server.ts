import 'dotenv/config';
import app from './app';
import prisma from './utils/prisma';
import { processAutoReleases } from './services/escrow.service';

const PORT = parseInt(process.env.PORT || '3001');

async function main() {
  await prisma.$connect();
  console.log('✅ Base de datos conectada');

  setInterval(async () => {
    const released = await processAutoReleases();
    if (released > 0) console.log(`💰 Auto-liberados ${released} pagos en escrow`);
  }, 60 * 60 * 1000);

  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📊 Prisma Studio: npx prisma studio`);
  });
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
