import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * trips-service ya no es un microservicio TCP aislado en la red privada de
 * Docker/Render: ahora es una API HTTP normal con URL pública (necesario
 * para poder desplegarse como Web Service gratis en Render, que no permite
 * tráfico de red privada entrante en el plan gratuito). Sin esta guarda,
 * cualquiera en internet podría llamar directamente a estos endpoints
 * saltándose el login y los guards de rol del api-gateway.
 *
 * Solución simple: una clave compartida (INTERNAL_API_KEY) que solo
 * conocen api-gateway, operations-service y trips-service. Cada llamada
 * interna debe traer el header `x-internal-key` con ese valor.
 */
@Injectable()
export class InternalAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const provided = request.headers['x-internal-key'];
    const expected = process.env.INTERNAL_API_KEY;

    if (!expected) {
      // Falla segura: si no se configuró la clave, no se puede confirmar
      // que la llamada sea legítima, así que se rechaza en vez de dejar
      // pasar todo por accidente en producción.
      throw new UnauthorizedException(
        'INTERNAL_API_KEY no está configurada en el servidor',
      );
    }

    if (provided !== expected) {
      throw new UnauthorizedException('Credencial interna inválida');
    }

    return true;
  }
}
