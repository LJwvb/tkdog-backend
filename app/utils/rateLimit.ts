// 简单的内存滑动窗口频控（防止脚本刷浏览/点赞/关注等写接口）
// 多实例部署时只能防单实例，需配合 nginx limit_req 等网关层限流做兜底

interface LimitOptions {
  /** 时间窗口（毫秒） */
  windowMs: number;
  /** 窗口内最大次数 */
  max: number;
}

const buckets = new Map<string, number[]>();

/**
 * 检查并记录一次请求；返回 true 表示允许，false 表示超限
 * @param key 自定义 key（建议 `${ip}:${action}`）
 */
export function rateLimit(key: string, opts: LimitOptions): boolean {
  const now = Date.now();
  const windowStart = now - opts.windowMs;
  const arr = buckets.get(key) || [];
  // 淘汰窗口外的旧时间戳
  while (arr.length && arr[0] < windowStart) arr.shift();
  if (arr.length >= opts.max) return false;
  arr.push(now);
  buckets.set(key, arr);
  return true;
}

/** 测试/调试用：清空所有计数 */
export function clearRateLimit(): void {
  buckets.clear();
}

export default rateLimit;
