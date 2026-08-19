import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async validateCredentials(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');

    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async findAllDrivers() {
    const drivers = await this.prisma.user.findMany({
      where: { role: Role.DRIVER },
      select: { id: true, name: true, email: true },
    });
    return drivers;
  }

  async create(data: {
    name: string;
    email: string;
    password: string;
    role: Role;
  }) {
    const passwordHash = await bcrypt.hash(data.password, 10);
    try {
      const user = await this.prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash,
          role: data.role,
        },
      });
      const { passwordHash: _, ...safeUser } = user;
      return safeUser;
    } catch (err: any) {
      // Prisma P2002 = violación de restricción única (email duplicado)
      if (err?.code === 'P2002') {
        throw new ConflictException(
          `Ya existe un usuario con el correo "${data.email}". Prueba con un nombre distinto.`,
        );
      }
      throw err;
    }
  }
}
