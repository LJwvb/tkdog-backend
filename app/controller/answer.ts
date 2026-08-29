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
  // AI 批改简答题（主观题），并计入成绩
  public async aiJudgeAnswer() {
    const { ctx } = this;
    const { questionId, userAnswer, recordId } = ctx.request.body;
    if (!questionId) {
      ctx.fail('questionId不能为空~');
      return;
    }
    // 未配置 AI 时告知前端降级，而不是报错
    if (!ctx.service.ai.isConfigured()) {
      ctx.success(
        { available: false, message: 'AI 判分未配置，请对照参考答案自行复核' },
        '请求成功',
      );
      return;
    }
    // 限流：防止恶意刷接口消耗大模型额度
    if (ctx.service.ai.isRateLimited(ctx.currentUserId())) {
      ctx.success(
        { available: false, message: 'AI 判分过于频繁，请稍后再试' },
        '请求成功',
      );
      return;
    }
    // 越权防护：若指定了 recordId，校验该答题记录属于当前用户，
    // 防止传入他人 recordId 篡改别人的成绩。
    if (recordId) {
      const answerRec = (await ctx.app.mysql.get('answer_record', {
        record_id: Number(recordId),
        question_id: Number(questionId),
      })) as any;
      if (!answerRec) {
        ctx.fail('答题记录不存在');
        return;
      }
      if (answerRec.user_id !== ctx.currentUserId()) {
        ctx.fail('无权操作他人的答题记录');
        return;
      }
    }
    const outcome = await ctx.service.ai.judgeByQuestionId(
      Number(questionId),
      String(userAnswer ?? ''),
    );
    if (outcome) {
      // 判分结果落库并重算整卷统计（recordId 为交卷返回的 paper_record.id）
      let stats: any = null;
      if (recordId) {
        stats = await ctx.service.answer.applyAiGrade(
          Number(recordId),
          Number(questionId),
          Number(outcome.score),
        );
      }
      ctx.success(
        { available: true, ...outcome, stats },
        'AI 批改完成',
      );
    } else {
      ctx.success(
        { available: false, message: 'AI 批改失败，请对照参考答案自行复核' },
        '请求成功',
      );
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
}
