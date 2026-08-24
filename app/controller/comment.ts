/* eslint-disable comma-dangle */
import { Controller } from 'egg';

export default class comment extends Controller {
  // 添加评论（分级：拦截词直接拒绝，审核词进入待审核）
  public async addComment() {
    const { ctx } = this;
    const { content, questionId, parentId, replyUsername, images } = ctx.request.body;
    if (!content || !questionId) {
      ctx.fail('请填写完整信息~');
      return;
    }
    const imageList = Array.isArray(images) ? images : [];
    if (imageList.length > 9) {
      ctx.fail('每条评论最多上传 9 张图片~');
      return;
    }
    if (!(await ctx.service.questions.isApproved(questionId))) {
      ctx.fail('该题目未通过审核，无法评论~');
      return;
    }
    const check = await ctx.service.sensitiveWord.check(content);
    if (check.blocked) {
      ctx.fail('评论包含违禁词，请文明发言~');
      return;
    }
    // 从 session 取当前登录用户 ID，不信任前端传入
    const result = await ctx.service.comment.addComment({
      content,
      questionId: Number(questionId),
      parentId,
      replyUsername,
      images: imageList,
      userId: ctx.currentUserId(),
      status: check.review ? 0 : 1,
    });
    if (result) {
      ctx.success(
        null,
        check.review ? '评论已提交，审核通过后展示~' : '评论成功~',
      );
    } else {
      ctx.fail('评论失败~');
    }
  }
  // 获取评论列表（可传 questionId 查某题评论；onlyApproved=true 仅返回审核通过；分页参数 currentPage/pageSize）
  public async getCommentList() {
    const { ctx } = this;
    const { questionId, onlyApproved, currentPage, pageSize, userId } = ctx.query;
    const result = await ctx.service.comment.getCommentList({
      questionId,
      onlyApproved: onlyApproved === 'true' || onlyApproved === '1',
      currentPage,
      pageSize,
      userId,
    });
    if (result) {
      ctx.success(result, '请求成功');
    } else {
      ctx.fail('获取评论列表失败');
    }
  }
  // 点赞评论
  public async likeComment() {
    const { ctx } = this;
    const { commentId } = ctx.request.body;
    const userId = ctx.currentUserId();
    if (!userId) {
      ctx.unauthorized();
      return;
    }
    if (!commentId) {
      ctx.fail('参数不完整~');
      return;
    }
    const result = await ctx.service.comment.likeComment(userId, Number(commentId));
    if (result) {
      ctx.success(null, '点赞成功~');
    } else {
      ctx.fail('点赞失败~');
    }
  }
  // 取消点赞评论
  public async unlikeComment() {
    const { ctx } = this;
    const { commentId } = ctx.request.body;
    const userId = ctx.currentUserId();
    if (!userId) {
      ctx.unauthorized();
      return;
    }
    if (!commentId) {
      ctx.fail('参数不完整~');
      return;
    }
    const result = await ctx.service.comment.unlikeComment(userId, Number(commentId));
    if (result) {
      ctx.success(null, '已取消点赞~');
    } else {
      ctx.fail('取消失败~');
    }
  }
  // 置顶/取消置顶评论（管理员）
  public async pinComment() {
    const { ctx } = this;
    const { id, pinned } = ctx.request.body;
    if (!id) {
      ctx.fail('id不能为空~');
      return;
    }
    const result = await ctx.service.comment.pinComment(Number(id), Boolean(pinned));
    if (result) {
      ctx.success(null, pinned ? '已置顶~' : '已取消置顶~');
    } else {
      ctx.fail('操作失败~');
    }
  }
  // 审核通过评论（待审核 → 通过）
  public async approveComment() {
    const { ctx } = this;
    const { id } = ctx.request.body;
    if (!id) {
      ctx.fail('id不能为空~');
      return;
    }
    const result = await ctx.service.comment.approveComment(id);
    if (result) {
      ctx.success(null, '已通过~');
    } else {
      ctx.fail('操作失败~');
    }
  }
  // 删除评论
  public async deleteComment() {
    const { ctx } = this;
    const { id } = ctx.request.body;
    if (!id) {
      ctx.fail('id不能为空~');
      return;
    }
    const result = await ctx.service.comment.deleteComment(id);
    if (result) {
      ctx.success(null, '删除成功~');
    } else {
      ctx.fail('删除失败~');
    }
  }
  // 已删除评论列表（管理端）
  public async getDeletedComments() {
    const { ctx } = this;
    const result = await ctx.service.comment.getDeletedComments();
    if (result) {
      ctx.success(result, '请求成功');
    } else {
      ctx.fail('获取失败~');
    }
  }
  // 恢复评论（管理端）
  public async restoreComment() {
    const { ctx } = this;
    const { id } = ctx.request.body;
    if (!id) {
      ctx.fail('id不能为空~');
      return;
    }
    const result = await ctx.service.comment.restoreComment(id);
    if (result) {
      ctx.success(null, '已恢复~');
    } else {
      ctx.fail('恢复失败~');
    }
  }
}
