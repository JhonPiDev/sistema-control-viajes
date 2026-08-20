/**
 * Seed de datos de prueba (idempotente).
 *
 * Se escribe en JavaScript plano (no TypeScript) a propósito: corre en el
 * contenedor de producción con "node prisma/seed.js" directo, sin pasar por
 * ts-node. Esto evita por completo los conflictos de resolución de módulos
 * de TypeScript (module/moduleResolution) que solo aparecen dentro del
 * contenedor y que no vale la pena depurar para un script tan simple.
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
  // cada arranque del contenedor (docker-entrypoint.sh -> "prisma db seed"),
  // y en el plan gratuito de Render eso pasa cada vez que el servicio
  // despierta de dormido. Antes había un viaje "Bogotá - Medellín (Demo)"
  // que se recreaba solo si se borraba (el findFirst + create de abajo era
  // idempotente para SEGUIR existiendo, no para quedarse borrado). Se quitó
  // para que el dashboard quede realmente vacío para quien prueba la app
  // por primera vez, y para que un viaje borrado no "reaparezca" solo.

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
