import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../constants';

export type AppRole = 'OWNER' | 'ADMIN' | 'STAFF' | 'CUSTOME';
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
