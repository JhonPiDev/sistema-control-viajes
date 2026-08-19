import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { InternalAuthGuard } from '../common/guards/internal-auth.guard';
import { UsersService } from './users.service';

@UseGuards(InternalAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Usado por api-gateway durante el login
  @Post('validate-credentials')
  validateCredentials(@Body() body: { email: string; password: string }) {
    return this.usersService.validateCredentials(body.email, body.password);
  }

  // IMPORTANTE: esta ruta fija va antes de ':id' para que Nest no la
  // confunda con un id de usuario.
  @Get('drivers')
  findAllDrivers() {
    return this.usersService.findAllDrivers();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  create(
    @Body()
    body: { name: string; email: string; password: string; role: 'ADMIN' | 'DRIVER' },
  ) {
    return this.usersService.create(body as any);
  }
}
