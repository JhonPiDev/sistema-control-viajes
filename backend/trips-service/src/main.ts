import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

/**
 * trips-service se levanta como una API HTTP normal (ya no como
 * microservicio TCP). El motivo: el plan gratuito de Render no permite
 * "Private Services" (que sí soportarían TCP aislado en red interna), así
 * que este servicio se despliega como Web Service normal, protegido con
 * una clave interna compartida (ver common/guards/internal-auth.guard.ts)
 * en vez de aislamiento de red. api-gateway y operations-service le hablan
 * por HTTP usando TRIPS_SERVICE_URL.
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
