import { Controller } from 'egg';
import { getNowFormatDate } from '../utils';

export default class paper extends Controller {
  // 组卷
  public async getPaperQuestions() {
    const { ctx } = this;
    const { ids, paperTitle, paperTags, purview, isPractice } = ctx.request.body;
    const arrayIds = String(ids)
      .split(',')
      .map((x: string) => x.trim())
      .filter((x: string) => x !== '');
    if (!paperTitle) {
      ctx.fail('请填写完整信息~');
      return;
    }
    const check = await ctx.service.sensitiveWord.check(
      [ paperTitle, paperTags ].filter(Boolean).join(' '),
    );
    if (check.blocked) {
      ctx.fail('试卷标题或标签包含违禁词，请修改后重试~');
      return;
    }
    // 练习卷（错题重练/随机练习）允许最少 1 道，正式组卷仍要求 5 道
    const minCount = isPractice ? 1 : 5;
    if (arrayIds.length < minCount) {
      ctx.fail(`题目数量不能少于${minCount}道~`);
      return;
    }
    // 不能大于50道题
    if (arrayIds.length > 50) {
      ctx.fail('组卷失败,题目数量不能大于50道~');
      return;
    }
    const result = await ctx.service.paper.getPaperQuestions({
      ids: arrayIds.join(','),
      // 从 session 取组卷人，不信任前端传入；优先普通用户 session，未登录普通用户时才用管理员身份
      author: ctx.currentUsername() || ctx.currentAdminName(),
      // 作者归属用唯一 user_id（管理员组卷时为 undefined → NULL）
      userId: ctx.currentUserId(),
      paper_title: paperTitle,
      paper_tags: paperTags,
      purview,
      ctime: getNowFormatDate(),
      // 命中「待审核」词时强制进入审核，否则沿用原有规则
      chkState: check.review ? 0 : Number(purview) === 1 ? 0 : 1,
    });
    if (result) {
      ctx.success({ paperId: result.insertId }, '组卷成功~');
    } else {
      ctx.fail('组卷失败,请重新组卷~');
    }
  }
  // 获取组卷列表
  public async getPaperQuestionsList() {
    const { ctx } = this;
    const { currentPage, pageSize, type, keyword } = ctx.request.body;
    const result = await ctx.service.paper.getPaperQuestionsList({
      currentPage,
      pageSize,
      type,
      keyword,
      // 我的试卷按唯一 user_id 查询（从 session 取，忽略前端传入的 author）
      userId: ctx.currentUserId(),
    });
    if (result) {
      ctx.success(result, '请求成功');
    } else {
      ctx.fail('获取题目失败~');
    }
  }
  // 试卷详情
  public async getPaperQuestionsDetail() {
    const { ctx } = this;
    const { paperId, forTest } = ctx.request.body;
    const result = await ctx.service.paper.getPaperQuestionsDetail({
      paperId,
      forTest: Boolean(forTest),
      // 服务端权限判定：游客一律隐藏；公开试卷登录用户可见，私有试卷仅作者本人或管理员可见
      userId: ctx.currentUserId(),
      isAdmin: ctx.isAdmin(),
    });
    if (result) {
      ctx.success(result, '请求成功');
    } else {
      ctx.fail('获取题目失败~');
    }
  }
  // 修改试卷公开/私密权限
  public async updatePaperPurview() {
    const { ctx } = this;
    const { paperId, purview } = ctx.request.body;
    const target = Number(purview);
    if (!paperId || ![ 1, 3 ].includes(target)) {
      ctx.fail('参数不合法~');
      return;
    }
    // 公开(1)需要重新审核；私有(3)无需审核直接通过
    const result = await ctx.service.paper.updatePaperPurview({
      paperId,
      purview: target,
      chkState: target === 1 ? 0 : 1,
      // 作者归属判断用唯一 user_id
      ownerId: ctx.currentUserId(),
    });
    if (result) {
      ctx.success(null, target === 1 ? '已设为公开，等待审核' : '已设为私有');
    } else {
      ctx.fail('设置失败，只能修改自己的试卷~');
    }
  }
  // 编辑自己的试卷题目（增删题目）
  public async updatePaperQuestions() {
    const { ctx } = this;
    const { paperId, ids } = ctx.request.body;
    if (!paperId || ids == null) {
      ctx.fail('参数不完整~');
      return;
    }
    const arrayIds = String(ids)
      .split(',')
      .map((x: string) => x.trim())
      .filter((x: string) => x !== '');
    if (arrayIds.length < 1 || arrayIds.length > 50) {
      ctx.fail('试卷题目数量需在 1 到 50 道之间~');
      return;
    }
    const result = await ctx.service.paper.updatePaperQuestions({
      paperId: Number(paperId),
      ids: arrayIds.join(','),
      // 作者归属判断用唯一 user_id
      ownerId: ctx.currentUserId(),
    });
    if (result) {
      const needReview = result.chkState === 0;
      ctx.success(
        null,
        needReview ? '修改成功，公开试卷需重新审核' : '修改成功~',
      );
    } else {
      ctx.fail('修改失败，只能修改自己的试卷~');
    }
  }

  // AI 智能组卷：按科目/难度/题型数量从已审核题库推荐题目组合
  public async aiPaperSuggest() {
    const { ctx } = this;
    const { subjectID, difficulty, counts, tags } = ctx.request.body;
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
    // 额度检查
    const hasCreditS = await ctx.service.ai.consumeCredit(ctx.currentUserId(), 1);
    if (!hasCreditS) {
      ctx.success(
        { available: false, message: 'AI 额度不足，可用积分兑换' },
        '请求成功',
      );
      return;
    }
    const result = await ctx.service.ai.suggestPaperQuestions({
      subjectID: subjectID === '' || subjectID === undefined ? undefined : Number(subjectID),
      difficulty: difficulty === '' || difficulty === undefined ? undefined : Number(difficulty),
      counts: counts || { single: 0, multiple: 0, judge: 0, essay: 0 },
      tags: Array.isArray(tags) ? tags : [],
    });
    if (result) {
      ctx.success({ available: true, ...result }, 'AI 组卷建议完成');
    } else {
      ctx.success(
        { available: false, message: 'AI 组卷失败，请调整条件后重试' },
        '请求成功',
      );
    }
  }
}
