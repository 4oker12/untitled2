import { Body, Controller, Post, Res } from '@nestjs/common';
import { ApiOkResponse, ApiTags, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { Response } from 'express';
import { Public} from "../../common/public.decorator.js";
import { AuthService } from './auth.service.js';
import { LoginDto, AuthUserDto, RegisterDto   } from './auth.dto.js';

@ApiTags('auth')
@ApiExtraModels(AuthUserDto) // <-- важно
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  private setAuthCookies(res: Response, tokens: { accessToken: string; refreshToken: string }) {
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000, path: '/',
    });
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, path: '/',
    });
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
  }

  @Public()
  @Post('login')
  @ApiOkResponse({
    description: 'Logged in',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            user: { $ref: getSchemaPath(AuthUserDto) },
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
      },
    },
  })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, accessToken, refreshToken } = await this.service.login(dto);
    this.setAuthCookies(res, { accessToken, refreshToken });
    return { data: { user, accessToken, refreshToken } };
  }

  @Public()
  @Post('register')
  @ApiOkResponse({
    description: 'Registered',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            user: { $ref: getSchemaPath(AuthUserDto) },
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
      },
    },
  })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { user, accessToken, refreshToken } = await this.service.register(dto);
    this.setAuthCookies(res, { accessToken, refreshToken });
    return { data: { user, accessToken, refreshToken } };
  }

  @Public()
  @Post('refresh')
  @ApiOkResponse({
    description: 'Refreshed',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            user: { $ref: getSchemaPath(AuthUserDto) },
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
      },
    },
  })
  async refresh(@Res({ passthrough: true }) res: Response) {
    const refreshToken = (res.req as any)?.cookies?.refreshToken;
    const { user, accessToken, refreshToken: newRefresh } = await this.service.refresh(refreshToken);
    this.setAuthCookies(res, { accessToken, refreshToken: newRefresh });
    return { data: { user, accessToken, refreshToken: newRefresh } };
  }

  @Public()
  @Post('logout')
  @ApiOkResponse({ description: 'Logged out', schema: { type: 'object', properties: { data: { type: 'object', properties: { ok: { type: 'boolean' } } } } } })
  async logout(@Res({ passthrough: true }) res: Response) {
    await this.service.logout();
    this.clearAuthCookies(res);
    return { data: { ok: true } };
  }
}
