import jwt from 'jsonwebtoken';

// JWT 密钥（生产环境应从环境变量读取）
const JWT_SECRET = process.env.JWT_SECRET || 'tkdog_jwt_secret_key_2026';
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
