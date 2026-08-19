import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // El límite por defecto de Express (100kb) es demasiado chico para la
  // firma digital: se envía como imagen PNG en base64, y con canvases de
  // alta densidad de píxeles (devicePixelRatio 2-3 en celulares/laptops
  // retina) fácilmente supera ese límite. Sin este ajuste, el POST a
  // /trips/:id/signature fallaba en silencio con 413 Payload Too Large.
  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ limit: '5mb', extended: true }));

  app.use(helmet());
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  });

  app.setGlobalPrefix('api');

  // Validación estricta de DTOs (whitelist + rechazo de propiedades no declaradas)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Manejo centralizado de errores (HTTP + errores propagados de microservicios)
  app.useGlobalFilters(new AllExceptionsFilter());

  const config = new DocumentBuilder()
    .setTitle('Sistema de Control de Viajes - API Gateway')
    .setDescription(
      'API REST pública que orquesta los microservicios trips-service y operations-service.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`🚪 API Gateway escuchando en http://localhost:${port}/api`);
  console.log(`📚 Documentación Swagger en http://localhost:${port}/api/docs`);
}
bootstrap();
