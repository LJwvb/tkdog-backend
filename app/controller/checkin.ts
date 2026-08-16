/* eslint-disable comma-dangle */
import { Controller } from 'egg';

export default class checkin extends Controller {
  // 每日打卡
  public async checkin() {
    const { ctx } = this;
    const result = await ctx.service.checkin.checkin(ctx.currentUserId());
    if (result) {
      ctx.success(result, result.already ? '今日已打卡~' : '打卡成功~');
    } else {
      ctx.fail('打卡失败~');
    }
  }
  // 打卡信息
  public async getCheckinInfo() {
    const { ctx } = this;
    const result = await ctx.service.checkin.getCheckinInfo(
      ctx.currentUserId(),
    );
    if (result) {
      ctx.success(result, '请求成功');
    } else {
      ctx.fail('获取打卡信息失败~');
    }
  }
}
