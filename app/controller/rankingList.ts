import { Controller } from 'egg';

export default class RankingList extends Controller {
  public async getRankingList() {
    const { ctx } = this;
    const { type } = ctx.query;
    const page = Number(ctx.query.page) || 1;
    const pageSize = Number(ctx.query.pageSize) || 20;
    const result = await ctx.service.rankingList.getRankingList(type, page, pageSize);
    if (result) {
      ctx.success(result, '请求成功');
    } else {
      ctx.fail('获取排行榜失败');
    }
  }
}
