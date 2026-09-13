import { Service } from 'egg';
import { getNowFormatDate } from '../utils';

export default class announcement extends Service {
  // 公告列表（按时间倒序）
  public async getList() {
    const { app } = this;
    try {
      const result = await app.mysql.query(
        'SELECT * FROM announcement WHERE is_deleted = 0 ORDER BY id DESC',
      );
      return result;
    } catch (err) {
      return null;
    }
  }
  // 新增公告
  public async add(title: string, content: string) {
    const { app } = this;
    try {
      const result = await app.mysql.insert('announcement', {
        title,
        content: content || '',
        ctime: getNowFormatDate(),
      });
      return result;
    } catch (err) {
      return null;
    }
  }
  // 删除公告（软删除）
  public async remove(id: number) {
    const { app } = this;
    try {
      const result = await app.mysql.update(
        'announcement',
        { is_deleted: 1 },
        { where: { id } },
      );
      return result;
    } catch (err) {
      return null;
    }
  }
  // 已删除公告列表（管理端恢复用）
  public async getDeletedList() {
    const { app } = this;
    try {
      const result = await app.mysql.query(
        'SELECT * FROM announcement WHERE is_deleted = 1 ORDER BY id DESC',
      );
      return result;
    } catch (err) {
      return null;
    }
  }
  // 恢复公告
  public async restore(id: number) {
    const { app } = this;
    try {
      const result = await app.mysql.update(
        'announcement',
        { is_deleted: 0 },
        { where: { id } },
      );
      return result;
    } catch (err) {
      return null;
    }
  }
  // 彻底删除公告（物理删除，不可恢复）
  public async purge(id: number) {
    const { app } = this;
    try {
      return await app.mysql.delete('announcement', { id });
    } catch (err) {
      return null;
    }
  }
}
