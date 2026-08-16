/* eslint-disable comma-dangle */
import { Controller } from 'egg';

export default class answer extends Controller {
  // 提交整卷作答并判分
  public async submitPaper() {
    const { ctx } = this;
    const { paperId, answers } = ctx.request.body;
    if (!paperId || !Array.isArray(answers) || answers.length === 0) {
      ctx.fail('请完成作答后再提交~');
      return;
    }
    const result = await ctx.service.answer.submitPaper({
      userId: ctx.currentUserId(),
      paperId: Number(paperId),
      answers,
    });
    if (result) {
      ctx.success(result, '交卷成功~');
    } else {
      ctx.fail('交卷失败，请稍后重试~');
    }
  }
  // 我的答题记录
  public async getMyPaperRecords() {
    const { ctx } = this;
    const result = await ctx.service.answer.getMyPaperRecords({
      userId: ctx.currentUserId(),
    });
    if (result) {
      ctx.success(result, '请求成功');
    } else {
      ctx.fail('获取答题记录失败~');
    }
  }
  // 答题统计
  public async getAnswerStats() {
    const { ctx } = this;
    const result = await ctx.service.answer.getAnswerStats(
      ctx.currentUserId(),
    );
    if (result) {
      ctx.success(result, '请求成功');
    } else {
      ctx.fail('获取答题统计失败~');
    }
  }
  // 错题本
  public async getWrongQuestions() {
    const { ctx } = this;
    const { currentPage, pageSize, subjectID } = ctx.request.body;
    const result = await ctx.service.answer.getWrongQuestions({
      userId: ctx.currentUserId(),
      currentPage,
      pageSize,
      subjectID,
    });
    if (result) {
      ctx.success(result, '请求成功');
    } else {
      ctx.fail('获取错题失败~');
    }
  }
  // 一键清空错题
  public async clearWrongQuestions() {
    const { ctx } = this;
    const result = await ctx.service.answer.clearWrongQuestions(
      ctx.currentUserId(),
    );
    if (result) {
      ctx.success(null, '错题已清空~');
    } else {
      ctx.fail('清空失败~');
    }
  }
  // 主观题待复核列表（管理员）
  public async getSubjectiveReviews() {
    const { ctx } = this;
    const result = await ctx.service.answer.getSubjectiveReviews();
    if (result) {
      ctx.success(result, '请求成功');
    } else {
      ctx.fail('获取待复核列表失败~');
    }
  }
  // 人工复核主观题（管理员）
  public async reviewSubjective() {
    const { ctx } = this;
    const { id, correct } = ctx.request.body;
    if (!id) {
      ctx.fail('id不能为空~');
      return;
    }
    const result = await ctx.service.answer.reviewSubjective(
      Number(id),
      Boolean(correct),
    );
    if (result) {
      ctx.success(null, correct ? '已判为正确' : '已判为错误');
    } else {
      ctx.fail('操作失败~');
    }
  }
}
