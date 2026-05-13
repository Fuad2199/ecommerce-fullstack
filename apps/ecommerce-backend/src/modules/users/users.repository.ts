import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/users.schema';

@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        password: dto.password,
      },
    });
  }

  update(id: string, dto: UpdateUserDto) {
    const data = {
      email: dto.email,
      username: dto.username,
      reason: dto.reason,
      profile: {},
    };
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }
}
