// 登录鉴权中间件：要求已登录（session 中存在 userId）
export default () => {
  return async (ctx, next) => {
    if (!ctx.currentUserId()) {
      ctx.unauthorized('未登录或登录已过期');
      return;
    }
    await next();
  };
};
