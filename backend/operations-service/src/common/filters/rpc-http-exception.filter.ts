import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';

/**
 * Por defecto, cuando un @MessagePattern lanza una HttpException normal
 * (NotFoundException, ConflictException, BadRequestException del
 * ValidationPipe, etc.) en lugar de una RpcException, Nest la serializa
 * al viajar por TCP como `{ status: 'error', message: exception.message }`,
 * perdiendo el código HTTP real y, en el caso de errores de validación,
 * el detalle de qué campo falló.
 *
 * Este filtro global intercepta cualquier HttpException lanzada dentro
 * de un microservicio y la reempaqueta en un objeto plano
 * `{ statusCode, error, message }` que el API Gateway puede traducir de
 * vuelta a una respuesta HTTP fiel (ver api-gateway/src/common/rpc.helper.ts).
 */
@Catch(HttpException)
export class RpcHttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, _host: ArgumentsHost): Observable<any> {
    const statusCode = exception.getStatus();
    const res = exception.getResponse();

    const body =
      typeof res === 'string'
        ? { statusCode, error: exception.name, message: res }
        : {
            statusCode,
            error: (res as any)?.error ?? exception.name,
            message: (res as any)?.message ?? exception.message,
          };

    return throwError(() => body);
  }
}
