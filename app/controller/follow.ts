import { Controller } from 'egg';

export default class follow extends Controller {
  // 关注用户
  public async follow() {
    const { ctx } = this;
    const userId = ctx.currentUserId();
    if (!userId) {
      ctx.unauthorized();
      return;
    }
    const { followedId } = ctx.request.body;
    if (!followedId) {
      ctx.fail('参数不完整~');
      return;
    }
    const result = await ctx.service.follow.follow(userId, Number(followedId));
    if (result) {
      ctx.success(null, '已关注~');
    } else {
      ctx.fail('关注失败~');
    }
  }
  // 取消关注
  public async unfollow() {
    const { ctx } = this;
    const userId = ctx.currentUserId();
    if (!userId) {
      ctx.unauthorized();
      return;
    }
    const { followedId } = ctx.request.body;
    if (!followedId) {
      ctx.fail('参数不完整~');
      return;
    }
    const result = await ctx.service.follow.unfollow(userId, Number(followedId));
    if (result) {
      ctx.success(null, '已取消关注~');
    } else {
      ctx.fail('取消失败~');
    }
  }
  // 关注列表
  public async getFollowing() {
    const { ctx } = this;
    const userId = ctx.currentUserId();
    if (!userId) {
      ctx.unauthorized();
      return;
    }
    const result = await ctx.service.follow.getFollowing(userId);
    ctx.success(result ?? [], '请求成功');
  }
  // 粉丝列表
  public async getFollowers() {
    const { ctx } = this;
    const userId = ctx.currentUserId();
    if (!userId) {
      ctx.unauthorized();
      return;
    }
    const result = await ctx.service.follow.getFollowers(userId);
    ctx.success(result ?? [], '请求成功');
  }
  // 关注/粉丝数量
  public async getCounts() {
    const { ctx } = this;
    const userId = ctx.currentUserId();
    if (!userId) {
      ctx.unauthorized();
      return;
    }
    const result = await ctx.service.follow.getCounts(userId);
    ctx.success(result, '请求成功');
  }
}
