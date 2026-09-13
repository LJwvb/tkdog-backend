/* eslint-disable comma-dangle */
import { Service } from 'egg';
import { getNowFormatDate } from '../utils';

// 敏感词内存缓存（单进程内有效，多进程部署需换 Redis 或定时刷新）
// 避免每次评论/上传/编辑资料都全表查询敏感词表
let cachedWords: Array<{ word: string; level: number }> | null = null;

export default class sensitiveWord extends Service {
  // 从数据库重新加载敏感词到内存缓存
  private async loadCache(): Promise<Array<{ word: string; level: number }>> {
    const { app } = this;
    const rows: any = await app.mysql.query(
      'SELECT word, level FROM sensitive_word WHERE is_deleted = 0',
    );
    cachedWords = rows.map((r: any) => ({
      word: String(r.word).toLowerCase(),
      level: Number(r.level),
    }));
    return cachedWords!;
  }

  // 失效缓存（增删改敏感词后调用）
  private invalidateCache() {
    cachedWords = null;
  }

  // 检测文本：blocked=命中「直接拦截」词，review=命中「待审核」词（忽略大小写）
  public async check(text: string): Promise<{ blocked: boolean; review: boolean }> {
    let blocked = false;
    let review = false;
    if (!text) return { blocked, review };
    const lower = text.toLowerCase();
    try {
      const words = cachedWords ?? (await this.loadCache());
      for (const w of words) {
        if (w.word && lower.includes(w.word)) {
          if (w.level === 2) {
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
      this.invalidateCache();
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
      this.invalidateCache();
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
      this.invalidateCache();
      return result;
    } catch (err) {
      return null;
    }
  }
  // 彻底删除违禁词（物理删除，不可恢复）
  public async purge(id: number) {
    const { app } = this;
    try {
      const result = await app.mysql.delete('sensitive_word', { id });
      this.invalidateCache();
      return result;
    } catch (err) {
      return null;
    }
  }
}
