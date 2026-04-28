import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '../../decorators/public.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type {
  LoginInputDto,
  LogoutInputDto,
  RefreshInputDto,
  RegisterInputDto,
} from './dto';
import {
  LoginSchema,
  LogoutSchema,
  RefreshSchema,
  RegisterSchema,
} from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JWTUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Get('public-ping')
  publicPing() {
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: JWTUser) {
    return { user };
  }

  @Public()
  @Post('register')
  @UsePipes(new ZodValidationPipe(RegisterSchema))
  async register(@Body() dto: RegisterInputDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Post('login')
  @UsePipes(new ZodValidationPipe(LoginSchema))
  async login(@Body() dto: LoginInputDto) {
    return this.auth.login(dto);
  }

  @Public()
  @Post('refresh')
  @UsePipes(new ZodValidationPipe(RefreshSchema))
  refresh(@Body() dto: RefreshInputDto) {
    return this.auth.refresh(dto);
  }

  @Post('logout')
  @UsePipes(new ZodValidationPipe(LogoutSchema))
  logout(@Body() dto: LogoutInputDto) {
    return this.auth.logout(dto);
  }
}
