/* eslint-disable comma-dangle */
import { Controller } from 'egg';

export default class sensitiveWord extends Controller {
  // 违禁词列表
  public async getList() {
    const { ctx } = this;
    const result = await ctx.service.sensitiveWord.getList(ctx.request.body);
    if (result) {
      ctx.success(result, '请求成功');
    } else {
      ctx.fail('获取违禁词列表失败~');
    }
  }
  // 添加违禁词
  public async add() {
    const { ctx } = this;
    const { word, level } = ctx.request.body;
    if (!word || !String(word).trim()) {
      ctx.fail('违禁词不能为空~');
      return;
    }
    const result = await ctx.service.sensitiveWord.add(word, level);
    if (result?.success) {
      ctx.success(null, '添加成功~');
    } else if (result?.duplicate) {
      ctx.fail('该违禁词已存在~');
    } else {
      ctx.fail('添加失败~');
    }
  }
  // 删除违禁词
  public async remove() {
    const { ctx } = this;
    const { id } = ctx.request.body;
    if (!id) {
      ctx.fail('id不能为空~');
      return;
    }
    const result = await ctx.service.sensitiveWord.remove(id);
    if (result) {
      ctx.success(null, '删除成功~');
    } else {
      ctx.fail('删除失败~');
    }
  }
  // 已删除违禁词列表（管理端）
  public async getDeletedList() {
    const { ctx } = this;
    const result = await ctx.service.sensitiveWord.getDeletedList(ctx.request.body);
    if (result) {
      ctx.success(result, '请求成功');
    } else {
      ctx.fail('获取失败~');
    }
  }
  // 恢复违禁词（管理端）
  public async restore() {
    const { ctx } = this;
    const { id } = ctx.request.body;
    if (!id) {
      ctx.fail('id不能为空~');
      return;
    }
    const result = await ctx.service.sensitiveWord.restore(id);
    if (result) {
      ctx.success(null, '已恢复~');
    } else {
      ctx.fail('恢复失败~');
    }
  }
}
