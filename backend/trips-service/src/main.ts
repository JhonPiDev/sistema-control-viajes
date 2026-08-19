import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { RpcHttpExceptionFilter } from './common/filters/rpc-http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: parseInt(process.env.TCP_PORT || '3001', 10),
      },
    },
  );

  // Validación estricta de DTOs también a nivel de microservicio
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Preserva el código HTTP real (400/404/409/...) y el detalle de
  // validación al propagar errores hacia el API Gateway por TCP.
  app.useGlobalFilters(new RpcHttpExceptionFilter());

  await app.listen();
  // eslint-disable-next-line no-console
  console.log(
    `🚌 trips-service (TCP) escuchando en puerto ${process.env.TCP_PORT || 3001}`,
  );
}
bootstrap();
