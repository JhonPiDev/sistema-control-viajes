import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import { sendRpc } from '../common/rpc.helper';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject('TRIPS_SERVICE') private readonly tripsClient: ClientProxy,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await sendRpc<any>(
      this.tripsClient,
      'user.validateCredentials',
      dto,
    );

    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: payload,
    };
  }

  async me(userId: string) {
    return sendRpc<any>(this.tripsClient, 'user.findById', { id: userId });
  }
}
