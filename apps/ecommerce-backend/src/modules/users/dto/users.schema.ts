import z from 'zod';
import { UserStatus } from '../../../generated/prisma/enums';
import { userValidationMessages as m } from '../users.messages';

/* ======================= ENUMS ======================= */

export const userStatusEnum = z.enum([
  'ACTIVE',
  'DISABLED',
  'SUSPENDED',
  'BANNED',
  'PENDING',
]);

/* ======================= COMMON ======================= */

export const passwordSchema = z
  .string()
  .min(8, m.password.min)
  .max(100)
  .regex(/[A-Z]/, m.password.regex)
  .regex(/[a-z]/, m.password.regex2)
  .regex(/[0-9]/, m.password.regex3);

/* ======================= CREATE USER ======================= */

export const createUserSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, m.username.regex)
    .optional(),
  password: passwordSchema,
});

export type CreateUserDto = z.infer<typeof createUserSchema>;

/* ======================= PROFILE ======================= */

export const createUserProfileSchema = z.object({
  firstName: z.string().min(2, m.firstName.min).max(50),
  lastName: z.string().min(2, m.lastName.min).max(50),
  phones: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/, m.phone.invalid)
    .optional(),
});

export type UserProfileDto = z.infer<typeof createUserProfileSchema>;

export const updateUserProfileSchema = createUserProfileSchema.partial();

/* ======================= RESPONSE DTO (SAFE) ======================= */
export const userResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string().nullable(),
  status: userStatusEnum,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UserResponseDto = z.infer<typeof userResponseSchema>;

/* ======================= QUERY (Pagination + Filter) ======================= */
export const userQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  status: userStatusEnum.optional(),
  search: z.string().optional(),
});

export type UserQueryDto = z.infer<typeof userQuerySchema>;

/* ======================= UPDATE USER (PATCH) ======================= */

export const updateUserSchema = z.object({
  email: z.string().email(m.email.valid).max(255, m.email.max).optional(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, m.username.regex)
    .optional(),
  reason: z.string().max(255).optional(),

  profile: updateUserProfileSchema.partial().optional(),
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>;

export const updateUserStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
});

export type UpdateUserStatusDto = z.infer<typeof updateUserStatusSchema>;

/* ======================= CHANGE PASSWORD ======================= */
export const changePasswordSchema = z.object({
  oldPassword: z.string(),
  newPassword: passwordSchema,
});

export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;

/*** USER PARAMS */

export const userIdParamSchema = z.object({
  id: z.string().cuid(m.user.id),
});
