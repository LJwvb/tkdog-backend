import { Controller } from 'egg';
import { getNowFormatDate } from '../utils';

export default class questions extends Controller {
  // 获取审核后的题目
  public async getQuestions() {
    const { ctx } = this;
    const result = await ctx.service.questions.getQuestions(ctx.request.body);

    if (result) {
      // 游客隐藏答案（浏览类接口统一剔除，避免绕过详情页抓取）
      this.stripAnswerList(result.result);
      ctx.success(result, '请求成功');
    } else {
      ctx.fail('获取题目失败~');
    }
  }
  // 题目详情
  public async getQuestionDetail() {
    const { ctx } = this;
    const { id } = ctx.request.body;
    if (!id) {
      ctx.fail('题目id不能为空');
      return;
    }
    const result = await ctx.service.questions.getQuestionDetail({ id });
    if (result) {
      // 游客（未登录且非管理员）隐藏答案，前端提示登录后可查看
      if (!ctx.currentUserId() && !ctx.isAdmin()) {
        delete (result as any).answer;
      }
      ctx.success(result, '请求成功');
    } else {
      ctx.fail('获取题目失败~');
    }
  }
  // 上传题目
  public async uploadQuestions() {
    const { ctx } = this;
    const { question, answer, questionType, difficulty } = ctx.request.body;
    if (!question || !answer || !questionType || !difficulty) {
      ctx.fail('请填写完整信息~');
      return;
    }
    const combined = [
      question,
      answer,
      ctx.request.body.questionDetail,
      ctx.request.body.tags,
    ]
      .filter(Boolean)
      .join(' ');
    const check = await ctx.service.sensitiveWord.check(combined);
    if (check.blocked) {
      ctx.fail('题目内容包含违禁词，请修改后重试~');
      return;
    }
    const result = await ctx.service.questions.uploadQuestions({
      ...ctx.request.body,
      // 从 session 取上传者身份，不信任前端传入；优先普通用户 session，未登录普通用户时才用管理员身份
      creator: ctx.currentUsername() || ctx.currentAdminName(),
      userId: ctx.currentUserId(),
      addDate: getNowFormatDate(),
      chkState: 0,
      catalogID: 0, // 最新
    });
    if (result) {
      ctx.success(null, '上传成功,请等待审核~');
    } else {
      ctx.fail('上传失败,请重新上传~');
    }
  }
  // 编辑题目（管理员可改任意题，普通用户只能改自己上传的题）
  public async updateQuestion() {
    const { ctx } = this;
    const { id, question, answer, difficulty, tags } = ctx.request.body;
    if (!id || !question || !answer) {
      ctx.fail('请填写完整信息~');
      return;
    }
    // 权限：管理员，或该题上传者本人
    const isAdmin = ctx.isAdmin();
    const userId = ctx.currentUserId();
    if (!isAdmin) {
      if (!userId) {
        ctx.fail('请先登录~');
        return;
      }
      const upload: any = await ctx.service.questions.getQuestionUpload(
        Number(id),
      );
      if (!upload || upload.user_id !== userId) {
        ctx.fail('只能编辑自己上传的题目~');
        return;
      }
    }
    const combined = [ question, answer, tags ].filter(Boolean).join(' ');
    const check = await ctx.service.sensitiveWord.check(combined);
    if (check.blocked) {
      ctx.fail('题目内容包含违禁词，请修改后重试~');
      return;
    }
    const result = await ctx.service.questions.updateQuestion({
      id: Number(id),
      question,
      answer,
      difficulty,
      tags: tags || '',
      updateTime: getNowFormatDate(),
      updateUser: ctx.currentAdminName() || ctx.currentUsername() || '',
      // 普通用户编辑需重新审核（仅审核通过的题会被置为待审核）
      needReview: !isAdmin,
    });
    if (result) {
      ctx.success(null, '修改成功~');
    } else {
      ctx.fail('修改失败~');
    }
  }
  // 批量导入题目
  public async importQuestions() {
    const { ctx } = this;
    const { questions } = ctx.request.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      ctx.fail('没有可导入的题目~');
      return;
    }
    // 违禁词检测：任一题目的题干/答案/标签/详情命中拦截词即整体拒绝
    const combined = questions
      .map((q: any) =>
        [ q?.question, q?.answer, q?.tags, q?.questionDetail ].filter(Boolean).join(' '),
      )
      .join(' ');
    const check = await ctx.service.sensitiveWord.check(combined);
    if (check.blocked) {
      ctx.fail('导入数据包含违禁词，请检查后重试~');
      return;
    }
    const result = await ctx.service.questions.importQuestions({
      questions,
      creator: ctx.currentUsername() || ctx.currentAdminName(),
      // 管理员导入不写入「用户上传」关联（管理员不属于 user 表）
      userId: ctx.currentUserId(),
      isAdmin: ctx.isAdmin() && !ctx.currentUserId(),
    });
    if (result) {
      ctx.success(result, `成功导入 ${result.imported} 道题目`);
    } else {
      ctx.fail('导入失败，请检查数据格式~');
    }
  }

  // 智能组卷：随机抽题
  public async randomPickQuestions() {
    const { ctx } = this;
    const result = await ctx.service.questions.randomPickQuestions(
      ctx.request.body,
    );
    if (result) {
      // 游客隐藏答案
      this.stripAnswerList(result);
      ctx.success(result, '请求成功');
    } else {
      ctx.fail('抽题失败~');
    }
  }

  // 每日一练
  public async getDailyQuestions() {
    const { ctx } = this;
    const result = await ctx.service.questions.getDailyQuestions();
    if (result) {
      // 游客隐藏答案
      this.stripAnswerList(result);
      ctx.success(result, '请求成功');
    } else {
      ctx.fail('获取题目失败~');
    }
  }
  // 点赞题目
  public async likeQuestions() {
    const { ctx } = this;
    const { id } = ctx.request.body;
    if (!id) {
      ctx.fail('请填写完整信息~');
      return;
    }
    if (!(await ctx.service.questions.isApproved(id))) {
      ctx.fail('该题目未通过审核，无法点赞~');
      return;
    }
    const result = await ctx.service.questions.likeQuestions({
      id,
      // 从 session 取点赞用户 ID，不信任前端传入
      userId: ctx.currentUserId(),
    });
    if (result) {
      ctx.success(null, '点赞成功~');
    } else {
      ctx.fail('点赞失败,请重新点赞~');
    }
  }
  // 取消点赞题目
  public async cancelLikeQuestions() {
    const { ctx } = this;
    const { id } = ctx.request.body;
    if (!id) {
      ctx.fail('请填写完整信息~');
      return;
    }
    if (!(await ctx.service.questions.isApproved(id))) {
      ctx.fail('该题目未通过审核，无法操作~');
      return;
    }
    const result = await ctx.service.questions.cancelLikeQuestions({
      id,
      // 从 session 取点赞用户 ID，不信任前端传入
      userId: ctx.currentUserId(),
    });
    if (result) {
      ctx.success(null, '取消点赞成功~');
    } else {
      ctx.fail('取消点赞失败,请重新取消点赞~');
    }
  }
  // 浏览数
  public async addBrowsesNum() {
    const { ctx } = this;
    const { id } = ctx.request.body;
    if (!id) {
      ctx.fail('请填写完整信息~');
      return;
    }
    if (!(await ctx.service.questions.isApproved(id))) {
      ctx.success(null, '');
      return;
    }
    const result = await ctx.service.questions.addBrowsesNum({
      id,
    });
    if (result) {
      ctx.success(null, '');
    } else {
      ctx.fail('浏览失败,请重新浏览~');
    }
  }
  // 相似题目
  public async getSimilarQuestions() {
    const { ctx } = this;
    const { id } = ctx.request.body;
    const result = await ctx.service.questions.getSimilarQuestions({
      id,
    });
    if (result) {
      ctx.success(result, '请求成功');
    } else {
      ctx.fail('获取题目失败~');
    }
  }
  // 搜索题目
  public async searchQuestions() {
    const { ctx } = this;
    const result = await ctx.service.questions.searchQuestions(ctx.request.body);
    if (result) {
      // 游客隐藏答案
      this.stripAnswerList(result.result);
      ctx.success(result, '请求成功');
    } else {
      ctx.fail('获取题目失败~');
    }
  }
  // 是否允许查看题目答案：已登录普通用户或管理员可见，游客隐藏
  private isAnswerVisible(): boolean {
    const { ctx } = this;
    return Boolean(ctx.currentUserId()) || Boolean(ctx.isAdmin());
  }
  // 游客场景下剔除题目对象中的答案字段
  private stripAnswerList(list: any): any {
    if (this.isAnswerVisible() || !Array.isArray(list)) return list;
    list.forEach((item) => {
      if (item && typeof item === 'object') {
        delete item.answer;
      }
    });
    return list;
  }
  // 标签统计（管理员）
  public async getTagStats() {
    const { ctx } = this;
    const result = await ctx.service.questions.getTagStats();
    if (result) {
      ctx.success(result, '请求成功');
    } else {
      ctx.fail('获取标签失败~');
    }
  }
  // 重命名标签（管理员）
  public async renameTag() {
    const { ctx } = this;
    const { oldTag, newTag } = ctx.request.body;
    const old = String(oldTag || '').trim();
    const fresh = String(newTag || '').trim();
    if (!old || !fresh) {
      ctx.fail('请填写完整信息~');
      return;
    }
    const result = await ctx.service.questions.renameTag(old, fresh);
    if (result) {
      ctx.success(null, `已更新 ${result.updated} 道题目`);
    } else {
      ctx.fail('重命名失败~');
    }
  }
  // 删除标签（管理员）
  public async deleteTag() {
    const { ctx } = this;
    const { tag } = ctx.request.body;
    const t = String(tag || '').trim();
    if (!t) {
      ctx.fail('标签不能为空~');
      return;
    }
    const result = await ctx.service.questions.deleteTag(t);
    if (result) {
      ctx.success(null, `已从 ${result.updated} 道题目移除`);
    } else {
      ctx.fail('删除失败~');
    }
  }
}
