import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Límite subido de 100kb (default de Express) a 5mb: la firma digital
  // viaja como PNG en base64 y lo supera fácilmente.
  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ limit: '5mb', extended: true }));

  app.use(helmet());
  // "origin: true" refleja el origen real de la petición — necesario
  // porque el string literal '*' no es válido junto con credentials:true,
  // y CORS_ORIGIN puede venir como "*" (default del Blueprint de Render).
  const corsOrigin = process.env.CORS_ORIGIN;
  app.enableCors({
    origin: corsOrigin && corsOrigin !== '*' ? corsOrigin.split(',') : true,
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
