import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { callService } from '../common/rpc.helper';
import { TRIPS_SERVICE_URL } from '../common/service-urls';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(dto: LoginDto) {
    const user = await callService<any>(
      TRIPS_SERVICE_URL,
      'POST',
      '/users/validate-credentials',
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
    return callService<any>(TRIPS_SERVICE_URL, 'GET', `/users/${userId}`);
  }
}
