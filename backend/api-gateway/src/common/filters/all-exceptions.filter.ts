import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Filtro centralizado de errores. Normaliza:
 *  - HttpException lanzadas en el propio gateway
 *  - Errores RPC propagados desde los microservicios vía TCP
 *    (NestJS los entrega como objetos { message, statusCode } o strings)
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionsFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Error interno del servidor';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (Array.isArray(res)) {
        // ValidationPipe del microservicio entrega un array de strings (uno
        // por campo inválido); sin este caso se perdía tras el texto genérico.
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        message = (res as any).message ?? message;
        error = (res as any).error ?? error;
      }
    } else if (
      exception &&
      typeof exception === 'object' &&
      'message' in (exception as any)
    ) {
      // Errores propagados desde los microservicios (RpcException serializada)
      const rpcError = exception as any;
      status = rpcError.statusCode || HttpStatus.BAD_REQUEST;
      message = rpcError.message || message;
      error = rpcError.error || 'Bad Request';
    }

    this.logger.error(
      `${request.method} ${request.url} -> ${status}: ${JSON.stringify(message)}`,
    );

    response.status(status).json({
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
