/* eslint-disable comma-dangle */
import { Controller } from 'egg';
import { removePassword } from '../utils';

export default class admin extends Controller {
  // 管理员登录
  public async adminLogin() {
    const { ctx } = this;
    const { name, password } = ctx.request.body;
    if (!name || !password) {
      ctx.fail('请填写完整信息~');
      return;
    }
    // 防暴力破解：管理员登录同样按 IP 限流（复用用户登录限流器）
    if (ctx.service.user.isLoginRateLimited(ctx.ip)) {
      ctx.fail('登录过于频繁，请稍后再试');
      return;
    }
    const data = await ctx.service.admin.adminLogin(ctx.request.body);
    if (data) {
      // 管理员身份写入独立 cookie（ADMIN_SESS），与普通用户 session 完全隔离，互不覆盖
      ctx.cookies.set(
        'ADMIN_SESS',
        JSON.stringify({ id: data.id, name: data.name }),
        {
          httpOnly: true,
          signed: true,
          maxAge: 24 * 3600 * 1000,
          overwrite: true,
        },
      );
      const returnData = removePassword(data);
      ctx.success(returnData, '登录成功');
    } else {
      ctx.fail('账号或密码错误，登录失败');
    }
  }
  // 修改密码
  public async editAdminPassword() {
    const { ctx } = this;
    const { password } = ctx.request.body;
    if (!password) {
      ctx.fail('请填写完整信息~');
      return;
    }
    const result = await ctx.service.admin.editAdminPassword(ctx.request.body);
    if (result) {
      ctx.success(null, '修改成功~');
    } else {
      ctx.fail('修改失败,请重新修改~');
    }
  }
  // 管理端编辑用户：修改用户名/手机号（用户名需唯一）
  public async adminUpdateUser() {
    const { ctx } = this;
    const { userId, username, phone } = ctx.request.body || {};
    if (!userId) {
      ctx.fail('缺少用户ID');
      return;
    }
    const check = await ctx.service.sensitiveWord.check(
      [ username, phone ].filter(Boolean).join(' '),
    );
    if (check && check.blocked) {
      ctx.fail('用户名包含违禁词，请修改后重试~');
      return;
    }
    const result = await ctx.service.admin.adminUpdateUser({ userId, username, phone });
    if (!result) {
      ctx.fail('修改失败');
      return;
    }
    if (result.duplicate) {
      ctx.fail('用户名已存在，请更换~');
      return;
    }
    ctx.success(null, '修改成功');
  }
  // 获取用户列表
  public async getUserList() {
    const { ctx } = this;

    const result = await ctx.service.admin.getUserList(ctx.request.body);

    if (result) {
      ctx.success(result, '请求成功');
    } else {
      ctx.fail('获取用户列表失败');
    }
  }
  // 首页统计
  public async getStatistics() {
    const { ctx } = this;
    const result = await ctx.service.admin.getStatistics();
    if (result) {
      ctx.success(result, '请求成功');
    } else {
      ctx.fail('获取统计信息失败');
    }
  }
  // 未审核数量统计（导航栏红点）
  public async getPendingCounts() {
    const { ctx } = this;
    const result = await ctx.service.admin.getPendingCounts();
    if (result) {
      ctx.success(result, '请求成功');
    } else {
      ctx.fail('获取统计失败');
    }
  }
  // 获取未审核题目
  public async getNoChkQuestions() {
    const { ctx } = this;
    const result = await ctx.service.admin.getNoChkQuestions(ctx.request.body);
    if (result) {
      ctx.success(result, '请求成功');
    } else {
      ctx.fail('获取题目失败~');
    }
  }
  // 所有已审核的题目
  public async getAllChkQuestions() {
    const { ctx } = this;
    const result = await ctx.service.admin.getAllChkQuestions(ctx.request.body);
    if (result) {
      ctx.success(result, '请求成功');
    } else {
      ctx.fail('获取题目失败~');
    }
  }
  // 管理端题目搜索（支持题干/题型/难度/状态等条件，覆盖全部状态）
  public async searchQuestions() {
    const { ctx } = this;
    const result = await ctx.service.admin.searchAdminQuestions(
      ctx.request.body
    );
    if (result) {
      ctx.success(result, '请求成功');
    } else {
      ctx.fail('搜索题目失败~');
    }
  }
  // 审核题目
  public async chkQuestions() {
    const { ctx } = this;
    const { id, chkState, chkRemarks } = ctx.request.body;
    if (!id || !chkState) {
      ctx.fail('请填写完整信息~');
      return;
    }
    const result = await ctx.service.admin.chkQuestions({
      id,
      chkState,
      chkRemarks,
    });
    if (result) {
      ctx.success(null, '审核成功~');
    } else {
      ctx.fail('审核失败,请重新审核~');
    }
  }
  // 删除题目
  public async deleteQuestions() {
    const { ctx } = this;
    const { id } = ctx.request.body;
    if (!id) {
      ctx.fail('请填写完整信息~');
      return;
    }
    const result = await ctx.service.admin.deleteQuestions({
      id,
    });
    if (result) {
      ctx.success(null, '删除成功~');
    } else {
      ctx.fail('删除失败,请重新删除~');
    }
  }
  // 审核试卷
  public async chkPaper() {
    const { ctx } = this;
    const { paperId, chkState } = ctx.request.body;
    const result = await ctx.service.admin.chkPaperQuestions({
      paperId,
      chkState,
    });
    if (result) {
      ctx.success(result, '审核通过');
    } else {
      ctx.fail('失败~');
    }
  }
  // 所有未审核的试卷
  public async getNoChkPaper() {
    const { ctx } = this;
    const result = await ctx.service.admin.getNoChkPaper(ctx.request.body);
    if (result) {
      ctx.success(result, '请求成功');
    } else {
      ctx.fail('获取题目失败~');
    }
  }
  // 所有已审核的试卷
  public async getAllChkPaper() {
    const { ctx } = this;
    const result = await ctx.service.admin.getAllChkPaper(ctx.request.body);
    if (result) {
      ctx.success(result, '请求成功');
    } else {
      ctx.fail('获取题目失败~');
    }
  }
  // 删除试卷（purge=true 时彻底删除：物理删除试卷及其答题记录等关联数据）
  public async deletePaper() {
    const { ctx } = this;
    const { paperId, purge } = ctx.request.body;
    const result = purge
      ? await ctx.service.admin.purgePaper(paperId)
      : await ctx.service.admin.deletePaper({
        paperId,
      });
    if (result) {
      ctx.success(null, purge ? '已彻底删除~' : '删除成功~');
    } else {
      ctx.fail('删除失败,请重新删除~');
    }
  }
  // 删除用户I（purge=true 时彻底删除：物理删除用户及其全部关联数据）
  public async deleteUser() {
    const { ctx } = this;
    const { userId, purge } = ctx.request.body;
    const result = purge
      ? await ctx.service.admin.purgeUser(userId)
      : await ctx.service.admin.deleteUser({
        userId,
      });
    if (result) {
      ctx.success(null, purge ? '已彻底删除~' : '删除成功~');
    } else {
      ctx.fail('删除失败,请重新删除~');
    }
  }
  // ===== 已删除数据 + 恢复 =====
  public async getDeletedQuestions() {
    const { ctx } = this;
    const result = await ctx.service.admin.getDeletedQuestions(ctx.request.body);
    if (result) {
      ctx.success(result, '请求成功');
    } else {
      ctx.fail('获取失败~');
    }
  }
  public async restoreQuestion() {
    const { ctx } = this;
    const { id } = ctx.request.body;
    if (!id) {
      ctx.fail('id不能为空~');
      return;
    }
    const result = await ctx.service.admin.restoreQuestion(id);
    if (result) {
      ctx.success(null, '已恢复~');
    } else {
      ctx.fail('恢复失败~');
    }
  }
  public async getDeletedPapers() {
    const { ctx } = this;
    const result = await ctx.service.admin.getDeletedPapers(ctx.request.body);
    if (result) {
      ctx.success(result, '请求成功');
    } else {
      ctx.fail('获取失败~');
    }
  }
  public async restorePaper() {
    const { ctx } = this;
    const { paperId } = ctx.request.body;
    if (!paperId) {
      ctx.fail('paperId不能为空~');
      return;
    }
    const result = await ctx.service.admin.restorePaper(paperId);
    if (result) {
      ctx.success(null, '已恢复~');
    } else {
      ctx.fail('恢复失败~');
    }
  }
  public async getDeletedUsers() {
    const { ctx } = this;
    const result = await ctx.service.admin.getDeletedUsers();
    if (result) {
      ctx.success(result, '请求成功');
    } else {
      ctx.fail('获取失败~');
    }
  }
  public async restoreUser() {
    const { ctx } = this;
    const { userId } = ctx.request.body;
    if (!userId) {
      ctx.fail('userId不能为空~');
      return;
    }
    const result = await ctx.service.admin.restoreUser(userId);
    if (result) {
      ctx.success(null, '已恢复~');
    } else {
      ctx.fail('恢复失败~');
    }
  }
}
