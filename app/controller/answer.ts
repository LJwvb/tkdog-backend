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
    // 额度检查
    const hasCredit1 = await ctx.service.ai.consumeCredit(ctx.currentUserId(), 1);
    if (!hasCredit1) {
      ctx.success(
        { available: false, message: 'AI 额度不足，可用积分兑换或明日再来' },
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
  // 批量 AI 判分（交卷时所有简答题一次调用，省 N-1 次网络往返）
  public async aiJudgeBatch() {
    const { ctx } = this;
    const { recordId, items } = ctx.request.body;
    if (!Array.isArray(items) || !items.length) {
      ctx.fail('items不能为空~');
      return;
    }
    if (!ctx.service.ai.isConfigured()) {
      ctx.success({ available: false, message: 'AI 判分未配置，请对照参考答案自行复核' }, '请求成功');
      return;
    }
    if (ctx.service.ai.isRateLimited(ctx.currentUserId())) {
      ctx.success({ available: false, message: 'AI 判分过于频繁，请稍后再试' }, '请求成功');
      return;
    }
    // 额度检查：按批次数扣减（每批20题算1次），空答案不调用AI的批次不扣
    const batchSize2 = 20;
    const nonEmptyItems = items.filter((it: any) => String(it.userAnswer ?? '').trim());
    const batchCount = Math.ceil(nonEmptyItems.length / batchSize2);
    if (batchCount > 0) {
      const hasCreditB = await ctx.service.ai.consumeCredit(ctx.currentUserId(), batchCount);
      if (!hasCreditB) {
        ctx.success({ available: false, message: `AI 额度不足（需${batchCount}次），可用积分兑换` }, '请求成功');
        return;
      }
    }
    // 越权校验
    if (recordId) {
      const rec: any = await ctx.app.mysql.get('paper_record', { id: Number(recordId) });
      if (!rec || rec.user_id !== ctx.currentUserId()) {
        ctx.fail('无权操作他人的答题记录');
        return;
      }
    }
    // 每批最多 20 题，超过分批调用
    const batchSize = 20;
    const allResults: Array<{ questionId: number; score: number; comment: string; isCorrect: boolean }> = [];
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const outcomes = await ctx.service.ai.judgeBatch(
        batch.map((it: any) => ({
          questionId: Number(it.questionId),
          userAnswer: String(it.userAnswer ?? ''),
        })),
      );
      if (outcomes) {
        for (const o of outcomes) {
          allResults.push(o);
          if (recordId) {
            await ctx.service.answer.applyAiGrade(Number(recordId), o.questionId, o.score);
          }
        }
      }
    }
    // 取最终统计
    let stats: any = null;
    if (recordId) {
      const rec: any = await ctx.app.mysql.get('paper_record', { id: Number(recordId) });
      if (rec) {
        stats = {
          score: rec.score,
          correctNum: rec.correct_num,
          wrongNum: rec.wrong_num,
          subjectiveNum: rec.subjective_num,
          questionNum: rec.question_num,
        };
      }
    }
    ctx.success({ available: true, results: allResults, stats }, 'AI 批量批改完成');
  }

  // AI 解题解析（题目详情页「AI 解题思路」）
  public async aiAnalyze() {
    const { ctx } = this;
    const { questionId } = ctx.request.body;
    if (!questionId) {
      ctx.fail('questionId不能为空~');
      return;
    }
    if (!ctx.service.ai.isConfigured()) {
      ctx.success(
        { available: false, message: 'AI 解析未配置' },
        '请求成功',
      );
      return;
    }
    if (ctx.service.ai.isRateLimited(ctx.currentUserId())) {
      ctx.success(
        { available: false, message: 'AI 请求过于频繁，请稍后再试' },
        '请求成功',
      );
      return;
    }
    // 额度检查
    const hasCredit3 = await ctx.service.ai.consumeCredit(ctx.currentUserId(), 1);
    if (!hasCredit3) {
      ctx.success(
        { available: false, message: 'AI 额度不足，可用积分兑换' },
        '请求成功',
      );
      return;
    }
    const result = await ctx.service.ai.analyzeQuestion(Number(questionId));
    if (result) {
      ctx.success({ available: true, ...result }, 'AI 解析完成');
    } else {
      ctx.success(
        { available: false, message: 'AI 解析失败，请稍后重试' },
        '请求成功',
      );
    }
  }

  // AI 答题提示：只给解题思路，不直接给答案（缓存命中不扣额度）
  public async aiHint() {
    const { ctx } = this;
    const { questionId } = ctx.request.body;
    if (!questionId) {
      ctx.fail('questionId不能为空~');
      return;
    }
    if (!ctx.service.ai.isConfigured()) {
      ctx.success({ available: false, message: 'AI 未配置' }, '请求成功');
      return;
    }
    if (ctx.service.ai.isRateLimited(ctx.currentUserId())) {
      ctx.success(
        { available: false, message: 'AI 请求过于频繁，请稍后再试' },
        '请求成功',
      );
      return;
    }
    // 缓存命中不扣额度：只查独立的 hint 字段（不含答案），不能复用 thinking
    const cached: any = await ctx.app.mysql.get('ai_analysis', { question_id: Number(questionId) });
    if (cached?.hint) {
      ctx.success({ available: true, hint: String(cached.hint), fromCache: true }, 'AI 提示（缓存）');
      return;
    }
    // 额度检查
    const hasCreditH = await ctx.service.ai.consumeCredit(ctx.currentUserId(), 1);
    if (!hasCreditH) {
      ctx.success(
        { available: false, message: 'AI 额度不足，可用积分兑换' },
        '请求成功',
      );
      return;
    }
    const result = await ctx.service.ai.getHint(Number(questionId));
    if (result) {
      ctx.success({ available: true, ...result }, 'AI 提示完成');
    } else {
      ctx.success(
        { available: false, message: 'AI 提示生成失败，请稍后重试' },
        '请求成功',
      );
    }
  }

  // AI 整卷分析报告：基于交卷记录生成整卷报告（带缓存）
  public async aiPaperReport() {
    const { ctx } = this;
    const { recordId } = ctx.request.body;
    if (!recordId) {
      ctx.fail('recordId不能为空~');
      return;
    }
    // 越权防护：只能分析自己的交卷记录
    const rec: any = await ctx.app.mysql.get('paper_record', {
      id: Number(recordId),
    });
    if (!rec || rec.user_id !== ctx.currentUserId()) {
      ctx.fail('交卷记录不存在或无权访问~');
      return;
    }
    if (!ctx.service.ai.isConfigured()) {
      ctx.success({ available: false, message: 'AI 未配置' }, '请求成功');
      return;
    }
    if (ctx.service.ai.isRateLimited(ctx.currentUserId())) {
      ctx.success(
        { available: false, message: 'AI 请求过于频繁，请稍后再试' },
        '请求成功',
      );
      return;
    }
    // 缓存命中不扣额度
    const cachedReport: any = await ctx.app.mysql.get('ai_paper_report', { record_id: Number(recordId) });
    if (cachedReport?.report) {
      try {
        const cached = JSON.parse(cachedReport.report);
        ctx.success({ available: true, ...cached, fromCache: true }, 'AI 报告（缓存）');
        return;
      } catch { /* 缓存损坏继续生成 */ }
    }
    // 额度检查
    const hasCreditR = await ctx.service.ai.consumeCredit(ctx.currentUserId(), 1);
    if (!hasCreditR) {
      ctx.success(
        { available: false, message: 'AI 额度不足，可用积分兑换' },
        '请求成功',
      );
      return;
    }
    const result = await ctx.service.ai.analyzePaperReport(Number(recordId));
    if (result) {
      ctx.success({ available: true, ...result }, 'AI 整卷分析完成');
    } else {
      ctx.success(
        { available: false, message: 'AI 分析失败，请稍后重试' },
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
  // 答题记录详情（回看某次答题）
  public async getRecordDetail() {
    const { ctx } = this;
    const { recordId } = ctx.request.body;
    if (!recordId) {
      ctx.fail('参数不完整~');
      return;
    }
    const result = await ctx.service.answer.getRecordDetail(
      Number(recordId),
      ctx.currentUserId(),
    );
    if (result) {
      ctx.success(result, '请求成功');
    } else {
      ctx.fail('记录不存在或无权查看~');
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
