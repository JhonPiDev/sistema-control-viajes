import { Controller, Get } from '@nestjs/common';

/**
 * Endpoint sin protección (a diferencia del resto de la API interna) para
 * que Render pueda verificar que el servicio sigue vivo (healthCheckPath
 * en deploy/render.yaml) y para diagnóstico manual.
 */
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok', service: 'trips-service' };
  }
}
