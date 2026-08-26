// 鉴权中间件：普通用户（session）或管理员（ADMIN_SESS cookie）任一即可
export default () => {
  return async (ctx, next) => {
    if (!ctx.currentUserId() && !ctx.isAdmin()) {
      ctx.unauthorized('未登录或登录已过期');
      return;
    }
    await next();
  };
};
