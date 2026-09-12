// 登录鉴权中间件：要求已登录（session 中存在 userId）
// 鉴权通过后异步更新用户的 last_active_at 字段（节流写入：同用户 60s 内最多写一次）
// last_active_at 用于真实反映"用户最近一次使用系统的时间"，与 last_login_time（用户主动输入密码的时间）区分开

import { getNowFormatDate } from '../utils';

// 节流：同用户在 THROTTLE_MS 内只写一次数据库
// 内存 Map 仅在 Egg 单进程下有效；多实例部署需要替换为 Redis（key: active:<userId>, ttl: 60s）
const lastWriteAt = new Map<number, number>();
const THROTTLE_MS = 60 * 1000;

export default () => {
  return async (ctx, next) => {
    const userId = ctx.currentUserId();
    if (!userId) {
      ctx.unauthorized('未登录或登录已过期');
      return;
    }

    await next();

    // 节流：避免每个请求都写库
    const now = Date.now();
    const last = lastWriteAt.get(userId) || 0;
    if (now - last < THROTTLE_MS) return;
    lastWriteAt.set(userId, now);

    // setImmediate 脱离主请求链路，避免拖慢接口响应
    // 写库失败必须吞掉，绝不能让活跃时间写入失败导致接口报错
    setImmediate(async () => {
      try {
        await ctx.app.mysql.update(
          'user',
          { last_active_at: getNowFormatDate() },
          { where: { userId } },
        );
      } catch (e) {
        ctx.logger.warn('[auth middleware] 更新 last_active_at 失败, userId=%s, err=%s',
          userId, (e as Error)?.message);
      }
    });
  };
};
