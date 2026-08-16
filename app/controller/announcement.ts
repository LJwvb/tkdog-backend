import { Controller } from 'egg';

export default class announcement extends Controller {
  // 公告列表（公开）
  public async getList() {
    const { ctx } = this;
    const result = await ctx.service.announcement.getList();
    if (result) {
      ctx.success(result, '请求成功');
    } else {
      ctx.fail('获取公告失败');
    }
  }
  // 新增公告（管理员）
  public async add() {
    const { ctx } = this;
    const { title, content } = ctx.request.body;
    if (!title || !String(title).trim()) {
      ctx.fail('公告标题不能为空~');
      return;
    }
    const result = await ctx.service.announcement.add(
      String(title).trim(),
      content,
    );
    if (result) {
      ctx.success(null, '发布成功~');
    } else {
      ctx.fail('发布失败~');
    }
  }
  // 删除公告（管理员）
  public async remove() {
    const { ctx } = this;
    const { id } = ctx.request.body;
    if (!id) {
      ctx.fail('id不能为空~');
      return;
    }
    const result = await ctx.service.announcement.remove(id);
    if (result) {
      ctx.success(null, '删除成功~');
    } else {
      ctx.fail('删除失败~');
    }
  }
  // 已删除公告列表（管理端）
  public async getDeletedList() {
    const { ctx } = this;
    const result = await ctx.service.announcement.getDeletedList();
    if (result) {
      ctx.success(result, '请求成功');
    } else {
      ctx.fail('获取失败~');
    }
  }
  // 恢复公告（管理端）
  public async restore() {
    const { ctx } = this;
    const { id } = ctx.request.body;
    if (!id) {
      ctx.fail('id不能为空~');
      return;
    }
    const result = await ctx.service.announcement.restore(id);
    if (result) {
      ctx.success(null, '已恢复~');
    } else {
      ctx.fail('恢复失败~');
    }
  }
}
