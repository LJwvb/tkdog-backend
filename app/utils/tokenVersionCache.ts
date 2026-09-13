// Token 版本号内存缓存（service/admin/user 改密/删账号时主动 clear，避免最长 60s 旧 token 仍可用）
// 账号删除/修改密码时 token_version +1，旧 token 会在缓存过期或显式清除后失效
import type { Application } from 'egg';

interface CacheEntry {
  version: number;
  expireAt: number;
}

const cache = new Map<number, CacheEntry>();
const CACHE_TTL = 60 * 1000;

async function refresh(app: Application, userId: number): Promise<void> {
  try {
    const user: any = await app.mysql.get('user', { userId });
    const version = Number(user?.token_version ?? 0);
    cache.set(userId, { version, expireAt: Date.now() + CACHE_TTL });
  } catch {
    // 查库失败保留旧缓存
  }
}

/**
 * 同步读取缓存版本号（命中返回 number，未命中或过期返回 undefined）。
 * 同时 fire-and-forget 异步刷新缓存（不阻塞当前请求）。
 * 调用方约定：undefined 视为"放行本次"（下次请求生效）。
 */
function read(app: Application, userId: number): number | undefined {
  const entry = cache.get(userId);
  if (entry && entry.expireAt > Date.now()) return entry.version;
  // 未命中或过期：异步刷新（不 await，让本次请求放行）
  void refresh(app, userId);
  // 命中但过期：从缓存中清除避免堆积
  if (entry) cache.delete(userId);
  return undefined;
}

/** 改密/删账号时调用：立刻让该 userId 的旧 token 失效，不等缓存 TTL */
function clear(userId: number): void {
  cache.delete(userId);
}

export const tokenVersionCache = { read, clear, refresh };
export default tokenVersionCache;
