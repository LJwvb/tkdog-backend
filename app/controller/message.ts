import { Controller } from 'egg';

export default class message extends Controller {
  // 发送私信
  public async send() {
    const { ctx } = this;
    const userId = ctx.currentUserId();
    if (!userId) {
      ctx.unauthorized();
      return;
    }
    const { toUserId, content } = ctx.request.body;
    const text = String(content || '').trim();
    if (!toUserId || !text) {
      ctx.fail('请填写完整信息~');
      return;
    }
    const check = await ctx.service.sensitiveWord.check(text);
    if (check.blocked) {
      ctx.fail('内容包含违禁词~');
      return;
    }
    const result = await ctx.service.message.send(
      userId,
      Number(toUserId),
      text,
    );
    if (result) {
      ctx.success(null, '发送成功~');
    } else {
      ctx.fail('发送失败~');
    }
  }
  // 会话列表
  public async getConversations() {
    const { ctx } = this;
    const userId = ctx.currentUserId();
    if (!userId) {
      ctx.unauthorized();
      return;
    }
    const result = await ctx.service.message.getConversations(userId);
    ctx.success(result ?? [], '请求成功');
  }
  // 与某用户的聊天记录
  public async getMessages() {
    const { ctx } = this;
    const userId = ctx.currentUserId();
    if (!userId) {
      ctx.unauthorized();
      return;
    }
    const { withUserId } = ctx.request.body;
    if (!withUserId) {
      ctx.fail('参数不完整~');
      return;
    }
    const result = await ctx.service.message.getMessages(
      userId,
      Number(withUserId),
    );
    ctx.success(result ?? [], '请求成功');
  }
  // 标记已读
  public async markRead() {
    const { ctx } = this;
    const userId = ctx.currentUserId();
    if (!userId) {
      ctx.unauthorized();
      return;
    }
    const { withUserId } = ctx.request.body;
    if (!withUserId) {
      ctx.fail('参数不完整~');
      return;
    }
    const result = await ctx.service.message.markRead(
      userId,
      Number(withUserId),
    );
    if (result) {
      ctx.success(null, '已读~');
    } else {
      ctx.fail('操作失败~');
    }
  }
  // 未读私信总数
  public async getUnreadCount() {
    const { ctx } = this;
    const userId = ctx.currentUserId();
    if (!userId) {
      ctx.unauthorized();
      return;
    }
    const result = await ctx.service.message.getUnreadCount(userId);
    ctx.success({ count: result }, '请求成功');
  }
}
