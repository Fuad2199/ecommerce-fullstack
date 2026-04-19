import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthRequest } from '../auth.request';

export type JWTUser = {
  userId: string;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JWTUser | null => {
    const req = ctx.switchToHttp().getRequest<AuthRequest>();
    return req.user ?? null;
  },
);
