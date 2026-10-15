// 清理历史遗留的 EGG_SESS cookie
//
// 旧版本沿用框架默认的 session cookie 名（EGG_SESS），浏览器里直接可见，
// 等于对外暴露后端框架。现已改名为 config.session.key（tkdog_sid）。
// 老 cookie 不会自己消失，这里在响应里补一个立即过期的 Set-Cookie 主动删除，
// 用户下次访问（任意接口请求）之后浏览器里就不再有 EGG_SESS。
//
// 细节：用 signed:false 读取 —— 老 cookie 即使签名不合法也只是读不到，
// 绝不能因为清理动作让正常请求报错。

import { Context } from 'egg';

export default function clearLegacySessionCookie() {
  return async (ctx: Context, next: () => Promise<void>) => {
    const legacy = ctx.cookies.get('EGG_SESS', { signed: false });
    if (legacy) {
      ctx.cookies.set('EGG_SESS', '', {
        path: '/',
        maxAge: 0, // 立即过期
        httpOnly: true,
        signed: false,
        overwrite: true,
      });
    }
    await next();
  };
}
