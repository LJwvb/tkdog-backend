import { Application, Context } from 'egg';

/**
 * 请求日志中间件：记录每个接口的方法、路径、状态码、耗时与当前用户。
 * 只记 URL 元信息，不记录请求体/响应体（避免密码、验证码、token 等敏感数据入日志）。
 */
export default function requestLog(_options: any, _app: Application) {
  return async (ctx: Context, next: () => Promise<any>) => {
    const start = Date.now();
    try {
      await next();
    } finally {
      const ms = Date.now() - start;
      const uid =
        (ctx as any).currentUserId?.() ?? (ctx as any).currentAdminId?.() ?? '-';
      ctx.logger.info(`[req] ${ctx.method} ${ctx.url} -> ${ctx.status} ${ms}ms uid=${uid}`);
    }
  };
}
