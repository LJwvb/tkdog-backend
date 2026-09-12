import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

// JWT 密钥：生产环境必须通过 JWT_SECRET 环境变量注入。
// 若沿用源码中的硬编码兜底值，任何人都可据此伪造任意用户的 token 提权。
// 因此仅当处于开发/本地环境时才回退到随机密钥，生产环境下缺失 JWT_SECRET 直接抛错。
//
// 环境判定同时认 EGG_SERVER_ENV 与 NODE_ENV：
//   - egg-scripts start 会自动设置 EGG_SERVER_ENV=prod（Egg 的官方约定，config.prod.ts 亦据此加载）
//   - 部分部署平台（容器/云托管）习惯用 NODE_ENV=production
// 两者任一为生产值即视为生产环境，避免因只设了一个而导致校验被绕过。
const JWT_SECRET: string = (() => {
  const fromEnv = process.env.JWT_SECRET;
  if (fromEnv) return fromEnv;

  const isProd = [ process.env.EGG_SERVER_ENV, process.env.NODE_ENV ]
    .some(v => v === 'prod' || v === 'production');
  if (isProd) {
    throw new Error(
      '[jwt] 生产环境必须设置 JWT_SECRET 环境变量，禁止使用内置默认密钥（可被用于伪造 token）',
    );
  }

  // 开发环境未配置时生成随机密钥（每次启动失效，仅适合本地开发）
  return randomBytes(32).toString('hex');
})();
// Access Token 过期时间：24 小时
const ACCESS_TOKEN_EXPIRES_IN = '24h';
// Refresh Token 过期时间：7 天
const REFRESH_TOKEN_EXPIRES_IN = '7d';

export interface JwtPayload {
  userId: number;
  username: string;
  type?: 'access' | 'refresh';
  tokenVersion?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * 生成 Access Token（24小时有效）
 */
export function generateAccessToken(payload: Omit<JwtPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'access' }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

/**
 * 生成 Refresh Token（7天有效）
 */
export function generateRefreshToken(payload: Omit<JwtPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'refresh' }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

/**
 * 生成双 Token
 */
export function generateTokenPair(payload: Omit<JwtPayload, 'type'>): TokenPair {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

/**
 * 验证 Token，返回 payload 或 null
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * 验证 Refresh Token（必须是 refresh 类型）
 */
export function verifyRefreshToken(token: string): JwtPayload | null {
  const payload = verifyToken(token);
  if (payload && payload.type === 'refresh') {
    return payload;
  }
  return null;
}

/**
 * 从 Authorization header 中提取 Bearer Token
 */
export function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }
  return null;
}
