import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';

/** Полезный тип для payload */
export interface JwtPayload {
  sub: string;
  role: 'ADMIN' | 'USER';
  jti?: string;
  type: 'access' | 'refresh';
}

/** Нормализует PEM-строку из .env (замена \\n -> \n) */
const normalizePem = (s: string) => s.replace(/\\n/g, '\n');

/**
 * Подписывает JWT (RS256). Совместимо с jsonwebtoken v9.
 * @param payload - полезная нагрузка токена
 * @param privateKeyPem - приватный ключ в PEM-формате (строка)
 * @param ttl - срок жизни ('15m' | '7d' | число секунд)
 */
export function signJwt(
    payload: JwtPayload,
    privateKeyPem: string,
    ttl: SignOptions['expiresIn']
): string {
  const opts: SignOptions = {
    algorithm: 'RS256',
    expiresIn: ttl,
  };
  return jwt.sign(payload, normalizePem(privateKeyPem), opts);
}

/**
 * Проверяет/декодирует JWT (RS256).
 * Возвращает типизированный payload.
 */
export function verifyJwt<T extends object = JwtPayload>(
    token: string,
    publicKeyPem: string
): T {
  const opts: VerifyOptions = { algorithms: ['RS256'] };
  const decoded = jwt.verify(token, normalizePem(publicKeyPem), opts);
  if (typeof decoded === 'string') {
    // На RS256 почти не встречается, но на всякий случай:
    return JSON.parse(decoded) as T;
  }
  return decoded as T;
}
