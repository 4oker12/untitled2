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
 * @param privateKeyPem - приватный ключ в PEM
 * @param expiresIn - ttl (строка вида '15m' | '7d' или число секунд)
 */
export function signJwt(
    payload: object,
    privateKeyPem: string,
    expiresIn?: string | number, // <-- так
): string {
  const opts: SignOptions = { algorithm: 'RS256' };
  if (expiresIn !== undefined) (opts as any).expiresIn = expiresIn;
  return jwt.sign(payload, privateKeyPem.replace(/\\n/g, '\n'), opts);
}

/**
 * Проверяет JWT (RS256) и возвращает типизированный payload.
 */
export function verifyJwt<T extends object = JwtPayload>(
    token: string,
    publicKeyPem: string
): T {
  const opts: VerifyOptions = { algorithms: ['RS256'] };
  const decoded = jwt.verify(token, normalizePem(publicKeyPem), opts);
  if (typeof decoded === 'string') {
    return JSON.parse(decoded) as T;
  }
  return decoded as T;
}
