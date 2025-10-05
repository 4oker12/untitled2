import { Injectable } from '@nestjs/common';

function bool(val: string | undefined, def = false) {
  if (val == null) return def;
  return ['1', 'true', 'yes', 'on'].includes(val.toLowerCase());
}

@Injectable()
export class ConfigService {
  readonly isProd = process.env.NODE_ENV === 'production';
  readonly corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  readonly accessPrivateKey = process.env.JWT_ACCESS_PRIVATE_KEY || '';
  readonly accessPublicKey = process.env.JWT_ACCESS_PUBLIC_KEY || '';
  readonly refreshPrivateKey = process.env.JWT_REFRESH_PRIVATE_KEY || '';
  readonly refreshPublicKey = process.env.JWT_REFRESH_PUBLIC_KEY || '';
  readonly accessTtl = process.env.ACCESS_TOKEN_TTL || '15m';
  readonly refreshTtl = process.env.REFRESH_TOKEN_TTL || '7d';
  readonly secureCookies = this.isProd;
}
