import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

/**
 * API HTTP normal (no microservicio TCP): el plan gratuito de Render no
 * soporta Private Services, así que se protege con una clave interna
 * compartida (ver internal-auth.guard.ts) en vez de aislamiento de red.
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

  const port = process.env.PORT || process.env.TCP_PORT || 3001;
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`🚌 trips-service (HTTP interno) escuchando en puerto ${port}`);
}
bootstrap();
