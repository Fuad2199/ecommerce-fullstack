import { JwtService } from '@nestjs/jwt';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { ConfigService } from '@nestjs/config';
import { RefreshPayload, TokenResponse } from './auth.types';
import {
  LoginInputDto,
  LogoutInputDto,
  RefreshInputDto,
  RegisterInputDto,
} from './dto/auth.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  private ttlToSeconds(ttl: string): number {
    const m = ttl.match(/^(\d+)([smhd])$/i);
    if (!m) return 15 * 60;

    const n = Number(m[1]);
    const unit = m[2].toLowerCase();

    if (!Number.isFinite(n) || n <= 0) return 15 * 60;

    switch (unit) {
      case 's':
        return n;
      case 'm':
        return n * 60;
      case 'h':
        return n * 60 * 60;
      case 'd':
        return n * 24 * 60 * 60;
      default:
        return 15 * 60;
    }
  }

  private async issueToken(userId: string): Promise<TokenResponse> {
    const accessSecret = this.config.get<string>('JWT_ACCESS_SECRET')!;
    const refreshSecret = this.config.get<string>('JWT_REFRESH_SECRET')!;
    const accessTtl = this.config.get<string>('JWT_ACCESS_TTL') ?? '15m';
    const refreshTtl = this.config.get<string>('JWT_REFRESH_TTL') ?? '30d';
    const saltRounds = this.config.get<number>('BCRYPT_SALT_ROUNDS')!;
    const accessExpiresIn = this.ttlToSeconds(accessTtl);
    const refreshExpiresIn = this.ttlToSeconds(refreshTtl);

    const accessToken = await this.jwt.signAsync(
      { sub: userId, type: 'access' },
      { secret: accessSecret, expiresIn: accessExpiresIn },
    );

    const refreshToken = await this.jwt.signAsync(
      { sub: userId, type: 'refresh' },
      { secret: refreshSecret, expiresIn: refreshExpiresIn },
    );

    const tokenHash = await bcrypt.hash(refreshToken, saltRounds);
    const expiresAt = new Date(Date.now() + refreshExpiresIn * 1000);

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    return { accessToken, refreshToken, tokenType: 'Bearer' };
  }

  private async verifyRefresh(token: string): Promise<RefreshPayload> {
    const refreshSecret = this.config.get<string>('JWT_REFRESH_SECRET')!;

    try {
      const payload = await this.jwt.verifyAsync<RefreshPayload>(token, {
        secret: refreshSecret,
      });
      if (typeof payload.sub !== 'string' || !payload.sub) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      if (payload.type && payload.type !== 'refresh')
        throw new UnauthorizedException('Invalid refresh token');
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async findMatchingRefresh(
    raw: string,
    rows: Array<{ id: string; tokenHash: string }>,
  ): Promise<{ id: string } | null> {
    for (const r of rows) {
      const ok = await bcrypt.compare(raw, r.tokenHash);
      if (ok) return { id: r.id };
    }
    return null;
  }

  private tryDecode(token: string): RefreshPayload | null {
    try {
      const decoded = this.jwt.decode<RefreshPayload>(token);

      if (!decoded || typeof decoded !== 'object') {
        return null;
      }

      if (!('sub' in decoded)) {
        return null;
      }
      return this.jwt.decode<RefreshPayload>(token) ?? null;
    } catch {
      return null;
    }
  }

  async register(dto: RegisterInputDto): Promise<TokenResponse> {
    const email = dto.email.trim().toLowerCase();
    const username = dto.username?.trim() || null;
    const existingEmail = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      throw new BadRequestException('Email already in use');
    }
    if (username) {
      const existingUsername = await this.prisma.user.findUnique({
        where: { username },
      });
      if (existingUsername)
        throw new BadRequestException('Username already in use');
    }
    const saltRounds = this.config.get<number>('BCRYPT_SALT_ROUNDS')!;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        password: passwordHash,
        status: 'ACTIVE',
        profile: {
          create: {
            firstName: dto.firstName,
            lastName: dto.lastName,
          },
        },
      },
      select: {
        id: true,
        email: true,
        username: true,
        status: true,
        profile: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'REGISTER',
        userId: user.id,
        entity: 'User',
        entityId: user.id,
        meta: { email: user.email },
      },
    });
    return this.issueToken(user.id);
  }

  async login(dto: LoginInputDto): Promise<TokenResponse> {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, password: true, status: true },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (user.status !== 'ACTIVE')
      throw new UnauthorizedException('User is disabled');

    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    await this.prisma.auditLog.create({
      data: {
        action: 'LOGIN',
        userId: user.id,
        entity: 'User',
        entityId: user.id,
      },
    });

    return this.issueToken(user.id);
  }

  async refresh(dto: RefreshInputDto): Promise<TokenResponse> {
    const raw = dto.refreshToken.trim();
    if (!raw) throw new UnauthorizedException('Invalid refresh token');

    const payload = await this.verifyRefresh(raw);

    const candidates = await this.prisma.refreshToken.findMany({
      where: {
        userId: payload.sub,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        tokenHash: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 25,
    });
    const matched = await this.findMatchingRefresh(raw, candidates);
    if (!matched) throw new UnauthorizedException('Invalid refresh token.');

    await this.prisma.refreshToken.update({
      where: { id: matched.id },
      data: { revokedAt: new Date() },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        userId: payload.sub,
        entity: 'RefreshToken',
        entityId: matched.id,
        meta: { rotate: true },
      },
    });
    return this.issueToken(payload.sub);
  }

  async logout(dto: LogoutInputDto): Promise<{ ok: true }> {
    const raw = dto.refreshToken.trim();
    if (!raw) return { ok: true };
    const decoded = this.tryDecode(raw);
    if (!decoded?.sub) return { ok: true };
    if (decoded.type && decoded.type !== 'refresh') return { ok: true };
    const candidates = await this.prisma.refreshToken.findMany({
      where: {
        userId: decoded.sub,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true, tokenHash: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    const matchedIds: string[] = [];
    for (const r of candidates) {
      const ok = await bcrypt.compare(raw, r.tokenHash);
      if (ok) matchedIds.push(r.id);
    }

    if (matchedIds.length === 0) return { ok: true };
    await this.prisma.refreshToken.updateMany({
      where: { id: { in: matchedIds } },
      data: { revokedAt: new Date() },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'LOGOUT',
        userId: decoded.sub,
        entity: 'RefreshToken',
        entityId: matchedIds[0],
        meta: { scope: 'current_session', revokedCount: matchedIds.length },
      },
    });
    return { ok: true };
  }
}
