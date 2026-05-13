import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Public } from '../../decorators/public.decorator';
import type {
  CreateUserDto,
  UpdateUserDto,
  UserQueryDto,
} from './dto/users.schema';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private service: UsersService) {}

  @Public()
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.service.create(dto);
  }

  @Public()
  @Get()
  findAll(@Query() query: UserQueryDto) {
    return this.service.findAll(query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Public()
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.service.update(id, dto);
  }

  @Public()
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
