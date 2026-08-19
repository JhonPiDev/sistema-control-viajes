import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

/**
 * Igual que trips-service: se levanta como API HTTP normal (Web Service en
 * Render, no Private Service) protegida con INTERNAL_API_KEY. Ver
 * trips-service/src/main.ts para la explicación completa del porqué.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = process.env.PORT || process.env.TCP_PORT || 3002;
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`🧾 operations-service (HTTP interno) escuchando en puerto ${port}`);
}
bootstrap();
