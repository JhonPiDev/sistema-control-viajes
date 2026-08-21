/**
 * Seed de datos de prueba (idempotente). En JS plano porque corre en el
 * contenedor con "node prisma/seed.js" directo, sin pasar por ts-node.
 */
const { PrismaClient, Role } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const driverPassword = await bcrypt.hash('Driver123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@viajes.com' },
    update: {},
    create: {
      name: 'Ana Administradora',
      email: 'admin@viajes.com',
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
  });

  const driver = await prisma.user.upsert({
    where: { email: 'conductor@viajes.com' },
    update: {},
    create: {
      name: 'Carlos Conductor',
      email: 'conductor@viajes.com',
      passwordHash: driverPassword,
      role: Role.DRIVER,
    },
  });

  await prisma.user.upsert({
    where: { email: 'conductor2@viajes.com' },
    update: {},
    create: {
      name: 'Luis Rodríguez',
      email: 'conductor2@viajes.com',
      passwordHash: driverPassword,
      role: Role.DRIVER,
    },
  });

  // A propósito NO se crea ningún viaje de demostración: este seed corre en
  // cada arranque del contenedor, así que un viaje demo aquí "reaparecería"
  // solo cada vez que se borrara.

  console.log('✅ Seed completado');
  console.log('----------------------------------------');
  console.log('Admin  -> admin@viajes.com / Admin123!');
  console.log('Driver -> conductor@viajes.com / Driver123!');
  console.log('Driver2-> conductor2@viajes.com / Driver123!');
  console.log('----------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
