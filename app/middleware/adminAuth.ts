// 管理员鉴权中间件：要求已登录且为管理员
export default () => {
  return async (ctx, next) => {
    if (!ctx.isAdmin()) {
      ctx.unauthorized('无管理员权限');
      return;
    }
    // 深度防御：反查 admin 表，确认 cookie 中的管理员 ID 真实存在，
    // 防止签名密钥泄露后伪造任意 ID 的管理员 cookie 提权。
    try {
      const raw = ctx.cookies.get('ADMIN_SESS', { signed: true });
      const adminInfo = raw ? JSON.parse(raw) : null;
      const adminId = adminInfo?.id;
      if (!adminId) {
        ctx.unauthorized('无管理员权限');
        return;
      }
      const exists = await ctx.app.mysql.get('admin', { id: adminId });
      if (!exists) {
        ctx.unauthorized('无管理员权限');
        return;
      }
    } catch (e) {
      ctx.unauthorized('无管理员权限');
      return;
    }
    await next();
  };
};
