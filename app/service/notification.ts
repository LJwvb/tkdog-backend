/* eslint-disable comma-dangle */
import { Service } from 'egg';
import { getNowFormatDate } from '../utils';

interface ICreateNotification {
  userId: number;
  type?: string;
  title?: string;
  content?: string;
  questionId?: number;
  commentId?: number;
}

export default class notification extends Service {
  // 创建通知（接收用户不存在时静默跳过，例如管理员上传的题目不通知）
  public async create(params: ICreateNotification) {
    const { app } = this;
    const { userId, type = 'system', title, content, questionId, commentId } = params;
    if (!userId) return null;
    try {
      const user: any = await app.mysql.get('user', { userId });
      if (!user) return null;
      const result = await app.mysql.insert('notification', {
        user_id: userId,
        type,
        title,
        content,
        question_id: questionId || null,
        comment_id: commentId || null,
        is_read: 0,
        ctime: getNowFormatDate(),
      });
      return result;
    } catch (err) {
      return null;
    }
  }
  // 获取通知列表
  public async getNotifications(userId) {
    const { app } = this;
    try {
      const result: any = await app.mysql.query(
        'SELECT * FROM notification WHERE user_id = ? ORDER BY id DESC',
        [ userId ],
      );
      return result;
    } catch (err) {
      return null;
    }
  }
  // 未读数量
  public async getUnreadCount(userId) {
    const { app } = this;
    try {
      const rows: any = await app.mysql.query(
        'SELECT COUNT(*) AS count FROM notification WHERE user_id = ? AND is_read = 0',
        [ userId ],
      );
      return rows[0].count;
    } catch (err) {
      return 0;
    }
  }
  // 标记单条已读
  public async markRead(id, userId) {
    const { app } = this;
    try {
      const result = await app.mysql.update(
        'notification',
        { is_read: 1 },
        { where: { id, user_id: userId } },
      );
      return result;
    } catch (err) {
      return null;
    }
  }
  // 全部标记已读
  public async markAllRead(userId) {
    const { app } = this;
    try {
      const result = await app.mysql.update(
        'notification',
        { is_read: 1 },
        { where: { user_id: userId, is_read: 0 } },
      );
      return result;
    } catch (err) {
      return null;
    }
  }
}
