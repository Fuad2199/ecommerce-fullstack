import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcrypt';
import type {
  CreateUserDto,
  UpdateUserDto,
  UserQueryDto,
} from './dto/users.schema';

@Injectable()
export class UsersService {
  remove: any;
  constructor(private readonly prisma: PrismaService) {}
  /* ========================================== CREATE USER ============================================ */
  public async create(dto: CreateUserDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.email },
          ...(dto.username ? [{ username: dto.username }] : []),
        ],
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
      },
    });
  }

  /* ======================== FIND ALL (Pagination + Filter + Search) ================================ */
  public async findAll(query: UserQueryDto) {
    const { page = 1, limit = 10, status, search } = query;

    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), 100);

    const where = {
      ...(status && { status }),
      ...(search && {
        OR: [
          {
            email: {
              contains: search,
              mode: 'insensitive' as const,
            },
          },
          {
            username: {
              contains: search,
              mode: 'insensitive' as const,
            },
          },
        ],
      }),
    };

    const skip = (safePage - 1) * safeLimit;

    const [users, totalUsers] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          email: true,
          username: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          profile: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const lastPage = Math.max(Math.ceil(totalUsers / safeLimit), 1);

    return {
      where,
      data: users,
      meta: {
        totalUsers,
        page: safePage,
        limit: safeLimit,
        lastPage,
        hasNextPage: safePage < lastPage,
        hashPrevPage: safePage > 1,
      },
    };
  }

  /* ==================================== PRIVATE HELPERS ========================================= */
  private async ensureUserExists(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id },

      select: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
  }

  /* ======================================== FIND ONE =============================================== */
  public async findOne(id: string) {
    await this.ensureUserExists(id);

    return this.prisma.user.findUnique({
      where: { id },

      select: {
        id: true,
        email: true,
        username: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
      },
    });
  }

  /* ========================================= UPDATE =============================================== */
  public async update(id: string, dto: UpdateUserDto) {
    await this.ensureUserExists(id);

    return this.prisma.user.update({
      where: { id },

      data: {
        email: dto.email,
        username: dto.username,

        ...(dto.profile && {
          profile: {
            create: {
              firstName: dto.profile.firstName!,
              lastName: dto.profile.lastName!,
              phone: dto.profile.phones,
            },

            update: {
              firstName: dto.profile.firstName!,
              lastName: dto.profile.lastName!,
              phone: dto.profile.phones,
            },
          },
        }),
      },

      select: {
        id: true,
        email: true,
        username: true,
        status: true,
        updatedAt: true,
        profile: true,
      },
    });
  }

  /* ========================================= DELETE =============================================== */
  public async delete(id: string) {
    await this.ensureUserExists(id);

    await this.prisma.user.delete({
      where: { id },
    });

    return {
      message: 'User deleted successfully',
    };
  }
}
