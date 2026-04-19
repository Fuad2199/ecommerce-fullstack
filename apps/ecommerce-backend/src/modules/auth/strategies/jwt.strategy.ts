import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

type AccessPayload = {
  sub: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
};

@Injectable()
export class JWTStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly config: ConfigService) {
    const secret = config.get<string>('JWT_ACCESS_SECRET');
    if (!secret) throw new Error('Missing env: JWT_ACCESS_SECRET');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }
  validate(payload: AccessPayload) {
    if (!payload.sub) throw new UnauthorizedException('Invalid token upload');
    if (payload.type && payload.type !== 'access') {
      throw new UnauthorizedException('Invalid access token');
    }
    return { userId: payload.sub, type: 'access' as const };
  }
}
