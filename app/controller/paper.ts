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
    const { currentPage, pageSize, author, type } = ctx.request.body;
    const result = await ctx.service.paper.getPaperQuestionsList({
      currentPage,
      pageSize,
      author,
      type,
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
      owner: ctx.currentUsername(),
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
      owner: ctx.currentUsername(),
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
}
