import { MemberShipRole } from '../../generated/prisma/enums';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
  };

  membership?: {
    id: string;
    role: MemberShipRole;
    organization: string;
  };
}
