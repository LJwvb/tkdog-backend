import { Controller } from 'egg';

export default class RankingList extends Controller {
  public async getRankingList() {
    const { ctx } = this;
    const { type } = ctx.query;
    const result = await ctx.service.rankingList.getRankingList(type);
    if (result) {
      ctx.success(result, '请求成功');
    } else {
      ctx.fail('获取排行榜失败');
    }
  }
}
