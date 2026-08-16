/* eslint-disable comma-dangle */
import { Controller } from 'egg';

export default class feedback extends Controller {
  // 提交纠错反馈
  public async submitFeedback() {
    const { ctx } = this;
    const { questionId, type, content } = ctx.request.body;
    if (!questionId || !content) {
      ctx.fail('请填写反馈内容~');
      return;
    }
    const check = await ctx.service.sensitiveWord.check(content);
    if (check.blocked) {
      ctx.fail('反馈内容包含违禁词，请文明发言~');
      return;
    }
    const result = await ctx.service.feedback.submitFeedback({
      questionId,
      type: type || 'error',
      content,
      userId: ctx.currentUserId(),
    });
    if ((result as any)?.duplicate) {
      ctx.fail('你已提交过该题目的纠错，请等待处理~');
    } else if (result) {
      ctx.success(null, '反馈已提交，感谢你的帮助~');
    } else {
      ctx.fail('提交失败~');
    }
  }
  // 反馈列表（管理员）
  public async getFeedbackList() {
    const { ctx } = this;
    const result = await ctx.service.feedback.getFeedbackList(ctx.request.body);
    if (result) {
      ctx.success(result, '请求成功');
    } else {
      ctx.fail('获取失败~');
    }
  }
  // 标记反馈已处理（管理员），并通知提交者
  public async resolveFeedback() {
    const { ctx } = this;
    const { id, remark } = ctx.request.body;
    if (!id) {
      ctx.fail('id不能为空~');
      return;
    }
    const result = await ctx.service.feedback.resolveFeedback({
      id,
      remark,
      resolver: ctx.currentAdminName(),
    });
    if (result?.success) {
      // 通知提交者
      const fb = result.feedback;
      if (fb?.user_id) {
        await ctx.service.notification.create({
          userId: fb.user_id,
          type: 'feedback_resolved',
          title: '纠错反馈已处理',
          content: `你提交的题目纠错已处理${remark ? '：' + remark : ''}`,
          questionId: fb.question_id || null,
        });
      }
      ctx.success(null, '已标记处理~');
    } else {
      ctx.fail('操作失败~');
    }
  }
  // 用户查看自己的反馈
  public async getMyFeedback() {
    const { ctx } = this;
    const result = await ctx.service.feedback.getMyFeedback({
      ...ctx.request.body,
      userId: ctx.currentUserId(),
    });
    if (result) {
      ctx.success(result, '请求成功');
    } else {
      ctx.fail('获取失败~');
    }
  }
  // 未处理反馈数量（管理端角标）
  public async getUnresolvedCount() {
    const { ctx } = this;
    const count = await ctx.service.feedback.getUnresolvedCount();
    ctx.success({ count }, '请求成功');
  }
}
