import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Usado por api-gateway durante el login
  @MessagePattern('user.validateCredentials')
  validateCredentials(@Payload() data: { email: string; password: string }) {
    return this.usersService.validateCredentials(data.email, data.password);
  }

  @MessagePattern('user.findById')
  findById(@Payload() data: { id: string }) {
    return this.usersService.findById(data.id);
  }

  @MessagePattern('user.findAllDrivers')
  findAllDrivers() {
    return this.usersService.findAllDrivers();
  }

  @MessagePattern('user.create')
  create(
    @Payload()
    data: { name: string; email: string; password: string; role: 'ADMIN' | 'DRIVER' },
  ) {
    return this.usersService.create(data as any);
  }
}
