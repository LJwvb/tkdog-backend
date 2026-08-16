// 管理员鉴权中间件：要求已登录且为管理员
export default () => {
  return async (ctx, next) => {
    if (!ctx.isAdmin()) {
      ctx.unauthorized('无管理员权限');
      return;
    }
    await next();
  };
};
