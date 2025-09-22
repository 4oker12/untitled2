import { Injectable } from '@nestjs/common';
import type { SignOptions } from 'jsonwebtoken'
import bcrypt from 'bcrypt';
import { ConfigService } from '../config/config.service.js';
import { signJwt, verifyJwt, type JwtPayload } from '../../common/jwt.js';

@Injectable()
export class AuthService {
  constructor(private readonly config: ConfigService) {}

  async hashPassword(password: string) {
    return bcrypt.hash(password, 12);
  }

  async comparePassword(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  }

  issueAccessToken(sub: string, role: 'ADMIN' | 'USER') {
    const payload: JwtPayload = { sub, role, type: 'access' };
    return signJwt(payload, this.config.accessPrivateKey, this.config.accessTtl as SignOptions['expiresIn']);
  }

  issueRefreshToken(sub: string, role: 'ADMIN' | 'USER') {
    const payload: JwtPayload = { sub, role, type: 'refresh' };
    return signJwt(payload, this.config.refreshPrivateKey,  this.config.refreshTtl as SignOptions['expiresIn']);
  }

  verifyAccessToken(token: string) {
    return verifyJwt<JwtPayload>(token, this.config.accessPublicKey);
  }

  verifyRefreshToken(token: string) {
    return verifyJwt<JwtPayload>(token, this.config.refreshPublicKey);
  }
}
