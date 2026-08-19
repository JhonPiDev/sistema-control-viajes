import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { sendRpc } from '../common/rpc.helper';
import { slugify } from '../common/slugify';
import { CreateDriverDto } from './dto/create-driver.dto';

@ApiTags('drivers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('drivers')
export class DriversController {
  constructor(@Inject('TRIPS_SERVICE') private readonly tripsClient: ClientProxy) {}

  @Get()
  @Roles('ADMIN')
  findAll() {
    return sendRpc(this.tripsClient, 'user.findAllDrivers', {});
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

    const driver = await sendRpc<any>(this.tripsClient, 'user.create', {
      name: dto.name,
      email,
      password,
      role: 'DRIVER',
    });

    return { ...driver, generatedPassword: password };
  }
}
