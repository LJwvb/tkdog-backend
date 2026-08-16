import { Controller } from 'egg';

export default class favorite extends Controller {
  // 收藏题目
  public async add() {
    const { ctx } = this;
    const { questionId } = ctx.request.body;
    const userId = ctx.currentUserId();
    if (!userId) {
      ctx.unauthorized();
      return;
    }
    if (!questionId) {
      ctx.fail('参数不完整~');
      return;
    }
    const result = await ctx.service.favorite.add(userId, Number(questionId));
    if (result) {
      ctx.success(null, '收藏成功~');
    } else {
      ctx.fail('收藏失败~');
    }
  }
  // 取消收藏
  public async remove() {
    const { ctx } = this;
    const { questionId } = ctx.request.body;
    const userId = ctx.currentUserId();
    if (!userId) {
      ctx.unauthorized();
      return;
    }
    if (!questionId) {
      ctx.fail('参数不完整~');
      return;
    }
    const result = await ctx.service.favorite.remove(userId, Number(questionId));
    if (result) {
      ctx.success(null, '已取消收藏~');
    } else {
      ctx.fail('取消失败~');
    }
  }
  // 我的收藏列表
  public async getList() {
    const { ctx } = this;
    const userId = ctx.currentUserId();
    if (!userId) {
      ctx.unauthorized();
      return;
    }
    const result = await ctx.service.favorite.getList(userId);
    if (result) {
      ctx.success(result, '请求成功');
    } else {
      ctx.fail('获取失败~');
    }
  }
}
