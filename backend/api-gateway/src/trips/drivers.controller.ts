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
   * Genera credenciales a partir del nombre (correo: slug@gmail.com,
   * password: driver<slug>). La contraseña en claro solo se devuelve
   * aquí, una vez, para que el admin se la entregue al conductor.
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
