import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../constants';
import { AuthRequest } from '../auth.request';
import { MemberShipRole, Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma.service';

type MembershipSelect = Prisma.MemberShipGetPayload<{
  select: { id: true; role: true };
}>;

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles =
      this.reflector.getAllAndOverride<MemberShipRole[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredRoles.length === 0) return true;

    const req = context.switchToHttp().getRequest<AuthRequest>();
    const userId = req.user?.userId || null;
    if (!userId) throw new UnauthorizedException('Unauthorized');

    const orgId = (req.headers.get('x-org-id') as string | undefined) ?? null;
    if (!orgId) throw new UnauthorizedException('Missing OrgId');
    const membership: MembershipSelect | null =
      (await this.prisma.memberShip.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId: orgId,
          },
        },
        select: { id: true, role: true },
      })) as { id: string; role: MemberShipRole } | null;
    if (!membership)
      throw new ForbiddenException('Not a member of organization');
    if (!requiredRoles.includes(membership.role)) {
      throw new ForbiddenException('Insufficent role');
    }
    req.membership = {
      id: membership.id,
      role: membership.role,
      organization: orgId,
    };
    return true;
  }
}
