import { ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { Prisma, type Profile } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service.js';
import { AuthService } from '../auth/auth.service.js';
import { ProfileDto, UpdateProfileDto } from './profile.dto.js';

@Injectable()
export class ProfileService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly auth: AuthService,
    ) {}

    private bearerOrCookie(req: Request): string | null {
        const header = req.header('authorization') ?? '';
        const bearer = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
        const cookie = (req as any).cookies?.['access_token'] as string | undefined;
        return bearer || cookie || null;
    }

    private async requireMe(req: Request) {
        const token = this.bearerOrCookie(req);
        if (!token) throw new ForbiddenException('Unauthorized');
        const payload = this.auth.verifyAccessToken(token);
        if (!payload?.sub) throw new ForbiddenException('Unauthorized');
        const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user) throw new ForbiddenException('Unauthorized');
        return user;
    }

    private toDto(row: Profile): ProfileDto {
        return {
            id: String(row.id),
            userId: String(row.userId),
            bio: row.bio ?? null,
            location: row.location ?? null,
            website: row.website ?? null,
            birthday: row.birthday ? new Date(row.birthday).toISOString() : null,
            createdAt:
                row.createdAt instanceof Date
                    ? row.createdAt.toISOString()
                    : new Date(row.createdAt).toISOString(),
            updatedAt:
                row.updatedAt instanceof Date
                    ? row.updatedAt.toISOString()
                    : new Date(row.updatedAt).toISOString(),
        };
    }

    async getMyProfile(req: Request): Promise<{ data: ProfileDto }> {
        const me = await this.requireMe(req);
        const existing = await this.prisma.profile.findUnique({ where: { userId: me.id } });
        if (!existing) {
            const created = await this.prisma.profile.create({
                data: { userId: me.id },
            });
            return { data: this.toDto(created) };
        }
        return { data: this.toDto(existing) };
    }

    async updateMyProfile(
        req: Request,
        body: UpdateProfileDto,
    ): Promise<{ data: ProfileDto }> {
        const me = await this.requireMe(req);

        const patch: Prisma.ProfileUpdateInput = {};
        const normalize = (value?: string | null) => {
            if (value === undefined) return undefined;
            const trimmed = value?.trim();
            return trimmed && trimmed.length > 0 ? trimmed : null;
        };

        if (body.bio !== undefined) patch.bio = normalize(body.bio);
        if (body.location !== undefined) patch.location = normalize(body.location);
        if (body.website !== undefined) patch.website = normalize(body.website);
        if (body.birthday !== undefined) {
            const value = normalize(body.birthday);
            patch.birthday = value ? new Date(value) : null;
        }

        const normalizedBio = normalize(body.bio) ?? null;
        const normalizedLocation = normalize(body.location) ?? null;
        const normalizedWebsite = normalize(body.website) ?? null;
        const normalizedBirthday = normalize(body.birthday);

        const updated = await this.prisma.profile.upsert({
            where: { userId: me.id },
            create: {
                userId: me.id,
                bio: normalizedBio,
                location: normalizedLocation,
                website: normalizedWebsite,
                birthday: normalizedBirthday ? new Date(normalizedBirthday) : null,
            },
            update: patch,
        });

        return { data: this.toDto(updated) };
    }
}