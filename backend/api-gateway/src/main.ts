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
  // CORS_ORIGIN puede venir sin definir, como "*" (comodín literal) o como
  // una lista separada por comas de orígenes reales (ej. la URL de Vercel).
  // BUG que arregla esto: antes se hacía siempre "CORS_ORIGIN?.split(',')",
  // así que si la variable llegaba a valer literalmente "*" (el default del
  // Blueprint de Render, ver render.yaml), el resultado era el ARREGLO
  // ["*"] en vez del comodín real — el paquete de cors compara el origen
  // de la petición contra ese arreglo, no lo encuentra ("*" no es tu URL de
  // Vercel), y rechaza todo sin mandar el header Access-Control-Allow-Origin
  // (justo el error "blocked by CORS policy" que se ve en el navegador).
  // Además, "origin: true" (no el string '*') es la forma correcta de
  // permitir cualquier origen cuando además se usa credentials: true.
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
