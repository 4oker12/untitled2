// app/backend/src/modules/profile/profile.controller.ts
import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiCookieAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type CurrentUserPayload } from '../../common/current-user.decorator.js';
import { ProfileService } from './profile.service.js';
import { ProfileDto, UpdateProfileDto } from './profile.dto.js';

const toDto = (u: any): ProfileDto => ({
    id: u.id,
    email: u.email,
    name: u.name ?? null,
    role: u.role,
    handle: u.handle ?? null,
});

@ApiTags('profile')
@ApiCookieAuth('cookie-auth')
@Controller('profile')
export class ProfileController {
    constructor(private readonly profile: ProfileService) {}

    /** Текущий пользователь */
    @Get()
    @ApiResponse({ status: 200, description: 'Current user profile', type: ProfileDto })
    async me(@CurrentUser() user: CurrentUserPayload): Promise<{ data: ProfileDto }> {
        const u = await this.profile.getById(user.sub);
        return { data: toDto(u) };
    }

    /** Обновить своё имя / handle */
    @Patch()
    @ApiResponse({ status: 200, description: 'Profile updated', type: ProfileDto })
    async updateMe(
        @CurrentUser() user: CurrentUserPayload,
        @Body() dto: UpdateProfileDto,
    ): Promise<{ data: ProfileDto }> {
        const u = await this.profile.update(user.sub, {
            name: dto.name ?? undefined,
            handle: dto.handle ?? undefined,
        });
        return { data: toDto(u) };
    }
}
