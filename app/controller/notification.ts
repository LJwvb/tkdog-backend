/* eslint-disable comma-dangle */
import { Controller } from 'egg';

export default class notification extends Controller {
  // 获取通知列表
  public async getNotifications() {
    const { ctx } = this;
    const result = await ctx.service.notification.getNotifications(
      ctx.currentUserId(),
    );
    if (result) {
      ctx.success(result, '请求成功');
    } else {
      ctx.fail('获取通知失败~');
    }
  }
  // 未读数量
  public async getUnreadCount() {
    const { ctx } = this;
    const result = await ctx.service.notification.getUnreadCount(
      ctx.currentUserId(),
    );
    ctx.success({ count: result }, '请求成功');
  }
  // 标记单条已读
  public async markRead() {
    const { ctx } = this;
    const { id } = ctx.request.body;
    if (!id) {
      ctx.fail('id不能为空~');
      return;
    }
    const result = await ctx.service.notification.markRead(
      id,
      ctx.currentUserId(),
    );
    if (result) {
      ctx.success(null, '已读~');
    } else {
      ctx.fail('操作失败~');
    }
  }
  // 全部标记已读
  public async markAllRead() {
    const { ctx } = this;
    const result = await ctx.service.notification.markAllRead(
      ctx.currentUserId(),
    );
    if (result) {
      ctx.success(null, '全部已读~');
    } else {
      ctx.fail('操作失败~');
    }
  }
}
