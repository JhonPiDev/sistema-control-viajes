import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * trips-service tiene URL pública (no red privada aislada), así que sin
 * esta guarda cualquiera podría llamarlo saltándose el gateway. Exige el
 * header `x-internal-key` con el valor de INTERNAL_API_KEY, compartido
 * entre los tres servicios backend.
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
