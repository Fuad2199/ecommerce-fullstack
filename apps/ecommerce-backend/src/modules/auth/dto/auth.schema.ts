import z from 'zod';

export const RegisterSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  username: z.string().trim().min(3).max(30).optional(),

  firstName: z.string().trim().min(2).max(40),
  lastName: z.string().trim().min(2).max(40),
});

export const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export const RefreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export const LogoutSchema = z.object({
  refreshToken: z.string().min(10),
});

export type RegisterInputDto = z.infer<typeof RegisterSchema>;
export type LoginInputDto = z.infer<typeof LoginSchema>;
export type RefreshInputDto = z.infer<typeof RefreshSchema>;
export type LogoutInputDto = z.infer<typeof LogoutSchema>;
