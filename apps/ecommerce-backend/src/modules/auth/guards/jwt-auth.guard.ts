import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../constants';
import { Observable } from 'rxjs';

interface JwtErrorInfo {
  name?:
    | 'TokenExpiredError'
    | 'JsonWebTokenError'
    | 'NotBeforeError'
    | (string & {});
  message?: string;
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
  handleRequest<TUser = any>(
    err: Error,
    user: TUser | false,
    info?: JwtErrorInfo,
  ) {
    if (err) throw err;
    if (info?.name) {
      switch (info.name) {
        case 'TokenExpiredError':
          throw new UnauthorizedException('Access token expired');
        case 'JsonWebTokenError':
          throw new UnauthorizedException('Invalid token');
        case 'NotBeforeError':
          throw new UnauthorizedException('Token not active yet');
        default:
          throw new UnauthorizedException('Unauthorized');
      }
    }
    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }
    return user;
  }
}
