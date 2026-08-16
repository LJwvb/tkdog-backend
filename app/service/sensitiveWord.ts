/* eslint-disable comma-dangle */
import { Service } from 'egg';
import { getNowFormatDate } from '../utils';

export default class sensitiveWord extends Service {
  // 检测文本：blocked=命中「直接拦截」词，review=命中「待审核」词（忽略大小写）
  public async check(text: string): Promise<{ blocked: boolean; review: boolean }> {
    const { app } = this;
    let blocked = false;
    let review = false;
    if (!text) return { blocked, review };
    const lower = text.toLowerCase();
    try {
      const words: any = await app.mysql.query(
        'SELECT * FROM sensitive_word WHERE is_deleted = 0',
      );
      for (const w of words) {
        const word = String(w.word).toLowerCase();
        if (word && lower.includes(word)) {
          if (Number(w.level) === 2) {
            review = true;
          } else {
            blocked = true;
            break;
          }
        }
      }
    } catch {
      // 查询失败时按无命中处理
    }
    return { blocked, review };
  }
  // 违禁词列表（分页，支持 keyword 模糊搜索）
  public async getList(params) {
    const { app } = this;
    const { currentPage = 1, pageSize = 10, keyword } = params || {};
    try {
      const page = Number(currentPage) || 1;
      const size = Number(pageSize) || 10;
      const kw = String(keyword || '').trim();
      const like = `%${kw}%`;
      const where = kw ? 'is_deleted = 0 AND word LIKE ?' : 'is_deleted = 0';
      const listArgs: any[] = kw
        ? [ like, size, (page - 1) * size ]
        : [ size, (page - 1) * size ];
      const countArgs: any[] = kw ? [ like ] : [];
      const result = await app.mysql.query(
        `SELECT * FROM sensitive_word WHERE ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
        listArgs,
      );
      const totalRows: any = await app.mysql.query(
        `SELECT COUNT(*) AS count FROM sensitive_word WHERE ${where}`,
        countArgs,
      );
      return { result, total: totalRows[0].count };
    } catch (err) {
      return null;
    }
  }
  // 添加违禁词
  public async add(word: string, level: number) {
    const { app } = this;
    try {
      const w = String(word || '').trim();
      if (!w) return { success: false };
      const existing = await app.mysql.get('sensitive_word', { word: w });
      if (existing) return { success: false, duplicate: true };
      const result: any = await app.mysql.insert('sensitive_word', {
        word: w,
        level: Number(level) === 2 ? 2 : 1,
        ctime: getNowFormatDate(),
      });
      return { success: true, id: result.insertId };
    } catch (err) {
      return null;
    }
  }
  // 删除违禁词（软删除）
  public async remove(id: number) {
    const { app } = this;
    try {
      const result = await app.mysql.update(
        'sensitive_word',
        { is_deleted: 1 },
        { where: { id } },
      );
      return result;
    } catch (err) {
      return null;
    }
  }
  // 已删除违禁词列表（管理端恢复用）
  public async getDeletedList(params) {
    const { app } = this;
    const { currentPage = 1, pageSize = 10 } = params || {};
    try {
      const page = Number(currentPage) || 1;
      const size = Number(pageSize) || 10;
      const result = await app.mysql.query(
        'SELECT * FROM sensitive_word WHERE is_deleted = 1 ORDER BY id DESC LIMIT ? OFFSET ?',
        [ size, (page - 1) * size ],
      );
      const totalRows: any = await app.mysql.query(
        'SELECT COUNT(*) AS count FROM sensitive_word WHERE is_deleted = 1',
      );
      return { result, total: totalRows[0].count };
    } catch (err) {
      return null;
    }
  }
  // 恢复违禁词
  public async restore(id: number) {
    const { app } = this;
    try {
      const result = await app.mysql.update(
        'sensitive_word',
        { is_deleted: 0 },
        { where: { id } },
      );
      return result;
    } catch (err) {
      return null;
    }
  }
}
