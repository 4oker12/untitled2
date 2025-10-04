import { Body, Controller, Get, Patch, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ApiCookieAuth, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ProfileService } from './profile.service.js';
import { ProfileDto, UpdateProfileDto } from './profile.dto.js';

@ApiTags('profile')
@ApiCookieAuth('access_token')
@Controller('profile')
export class ProfileController {
    constructor(private readonly service: ProfileService) {}

    @Get('me')
    @ApiResponse({ status: 200, type: ProfileDto })
    async getMyProfile(@Req() req: Request): Promise<{ data: ProfileDto }> {
        return this.service.getMyProfile(req);
    }

    @Patch('me')
    @ApiResponse({ status: 200, type: ProfileDto })
    async updateMyProfile(
        @Req() req: Request,
        @Body() body: UpdateProfileDto,
    ): Promise<{ data: ProfileDto }> {
        return this.service.updateMyProfile(req, body);
    }
}