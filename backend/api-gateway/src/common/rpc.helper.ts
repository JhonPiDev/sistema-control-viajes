import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, timeout, TimeoutError } from 'rxjs';
import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Helper para enviar mensajes TCP a los microservicios y traducir
 * cualquier error (o timeout) en una HttpException legible, que luego
 * formatea el AllExceptionsFilter.
 *
 * Importante: los microservicios envían `{ statusCode, error, message }`
 * gracias a RpcHttpExceptionFilter (ver src/common/filters en cada
 * microservicio). NUNCA hay que confiar en un `err.status` genérico sin
 * validar que sea numérico:
 * Nest serializa por defecto los errores no-RpcException como
 * `{ status: 'error', message }`, y pasarle ese string 'error' a
 * HttpException/response.status() revienta el proceso con
 * ERR_HTTP_INVALID_STATUS_CODE.
 */
export async function sendRpc<T>(
  client: ClientProxy,
  pattern: string,
  payload: unknown,
): Promise<T> {
  return firstValueFrom(
    client.send<T>(pattern, payload).pipe(
      timeout(8000),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          throw new HttpException(
            'El microservicio no respondió a tiempo',
            HttpStatus.GATEWAY_TIMEOUT,
          );
        }

        const statusCode =
          typeof err?.statusCode === 'number'
            ? err.statusCode
            : typeof err?.status === 'number'
              ? err.status
              : HttpStatus.BAD_GATEWAY;
        const message =
          err?.message ??
          err?.response?.message ??
          'Error de comunicación con el microservicio';

        throw new HttpException(message, statusCode);
      }),
    ),
  );
}
