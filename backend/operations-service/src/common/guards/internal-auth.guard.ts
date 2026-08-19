import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * Igual que en trips-service: operations-service ahora es una API HTTP
 * pública (Web Service en el plan gratis de Render), así que estos
 * endpoints internos se protegen con una clave compartida en vez de
 * aislamiento de red. Solo api-gateway debería estar llamando aquí.
 */
@Injectable()
export class InternalAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const provided = request.headers['x-internal-key'];
    const expected = process.env.INTERNAL_API_KEY;

    if (!expected) {
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
