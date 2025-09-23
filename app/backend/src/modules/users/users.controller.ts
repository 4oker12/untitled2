// src/modules/users/users.controller.ts
// Controller = HTTP слой. Принимает DTO, валидирует, вызывает Service,
// и МАПИТ результат из БД в DTO для ответа (не выдаём секретные поля).

import { Body, Controller, Get, Param, Post, Patch, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { CreateUserDto, UpdateUserDto, UserDto, Role } from './dto.js';

// [ADDED] утилита маппинга из сущности БД в DTO ответа
const toUserDto = (u: any): UserDto => ({
  id: u.id,
  email: u.email,
  name: u.name ?? null,
  role: (u.role as unknown as Role) ?? 'USER',
  handle: u.handle ?? null,
});

@ApiTags('users')
@ApiCookieAuth('access_token')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'List or search users', type: [UserDto] })
  async list(@Query('search') search?: string): Promise<{ data: UserDto[] }> {
    const items = search && search.trim().length >= 2
      ? await this.users.searchByHandle(search)
      : await this.users.list();
    return { data: items.map(toUserDto) };
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'User by id', type: UserDto })
  async getById(@Param('id') id: string): Promise<{ data: UserDto | null }> {
    const u = await this.users.findById(id);
    return { data: u ? toUserDto(u) : null };
  }

  @Post()
  @ApiResponse({ status: 201, description: 'User created', type: UserDto })
  async create(@Body() dto: CreateUserDto): Promise<{ data: UserDto }> {
    const user = await this.users.create({
      email: dto.email,
      password: dto.password, // валидируется DTO
      name: dto.name ?? null,
      role: (dto.role ?? 'USER') as any,
      handle: dto.handle ?? null,
    });
    return { data: toUserDto(user) };
  }

  @Patch(':id')
  @ApiResponse({ status: 200, description: 'User updated', type: UserDto })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto): Promise<{ data: UserDto }> {
    const user = await this.users.update(id, {
      name: dto.name ?? undefined,
      role: (dto.role as any) ?? undefined,
      handle: dto.handle ?? undefined,
    });
    return { data: toUserDto(user) };
  }
}
