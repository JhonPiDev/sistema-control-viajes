import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { callService } from '../common/rpc.helper';
import { TRIPS_SERVICE_URL } from '../common/service-urls';
import { slugify } from '../common/slugify';
import { CreateDriverDto } from './dto/create-driver.dto';

@ApiTags('drivers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('drivers')
export class DriversController {
  @Get()
  @Roles('ADMIN')
  findAll() {
    return callService(TRIPS_SERVICE_URL, 'GET', '/users/drivers');
  }

  /**
   * Crea un conductor con credenciales autogeneradas a partir del nombre:
   *   correo:    <nombre-sin-espacios-ni-tildes>@gmail.com
   *   contraseña: driver<nombre-sin-espacios-ni-tildes>
   * La contraseña en texto plano solo se devuelve UNA VEZ en esta
   * respuesta (luego queda hasheada en la base de datos) para que el
   * administrador la copie y se la entregue al conductor.
   */
  @Post()
  @Roles('ADMIN')
  async create(@Body() dto: CreateDriverDto) {
    const slug = slugify(dto.name);
    const email = `${slug}@gmail.com`;
    const password = `driver${slug}`;

    const driver = await callService<any>(TRIPS_SERVICE_URL, 'POST', '/users', {
      name: dto.name,
      email,
      password,
      role: 'DRIVER',
    });

    return { ...driver, generatedPassword: password };
  }
}
