import { Service } from 'egg';
import { getNowFormatDate } from '../utils';

export default class message extends Service {
  // 发送私信
  public async send(fromUserId: number, toUserId: number, content: string) {
    const { app } = this;
    try {
      const result = await app.mysql.insert('message', {
        from_user_id: fromUserId,
        to_user_id: toUserId,
        content,
        is_read: 0,
        ctime: getNowFormatDate(),
      });
      return result;
    } catch (err) {
      return null;
    }
  }
  // 会话列表（与我聊过天的用户 + 最后一条消息 + 未读数）
  public async getConversations(userId: number) {
    const { app } = this;
    try {
      const result = await app.mysql.query(
        'SELECT u.userId, u.username, u.avatar, ' +
          '(SELECT content FROM message m2 WHERE (m2.from_user_id = u.userId AND m2.to_user_id = ?) OR (m2.from_user_id = ? AND m2.to_user_id = u.userId) ORDER BY m2.id DESC LIMIT 1) AS last_content, ' +
          '(SELECT ctime FROM message m3 WHERE (m3.from_user_id = u.userId AND m3.to_user_id = ?) OR (m3.from_user_id = ? AND m3.to_user_id = u.userId) ORDER BY m3.id DESC LIMIT 1) AS last_time, ' +
          '(SELECT COUNT(*) FROM message m4 WHERE m4.from_user_id = u.userId AND m4.to_user_id = ? AND m4.is_read = 0) AS unread ' +
          'FROM user u ' +
          'WHERE u.userId IN (SELECT DISTINCT CASE WHEN from_user_id = ? THEN to_user_id ELSE from_user_id END FROM message WHERE from_user_id = ? OR to_user_id = ?) ' +
          'ORDER BY last_time DESC',
        [ userId, userId, userId, userId, userId, userId, userId, userId ],
      );
      return result;
    } catch (err) {
      return null;
    }
  }
  // 与某用户的聊天记录
  public async getMessages(userId: number, withUserId: number) {
    const { app } = this;
    try {
      const result = await app.mysql.query(
        'SELECT * FROM message WHERE (from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?) ORDER BY id ASC',
        [ userId, withUserId, withUserId, userId ],
      );
      return result;
    } catch (err) {
      return null;
    }
  }
  // 标记与某用户的会话为已读
  public async markRead(userId: number, withUserId: number) {
    const { app } = this;
    try {
      const result = await app.mysql.update(
        'message',
        { is_read: 1 },
        { where: { to_user_id: userId, from_user_id: withUserId } },
      );
      return result;
    } catch (err) {
      return null;
    }
  }
  // 未读私信总数
  public async getUnreadCount(userId: number) {
    const { app } = this;
    try {
      const rows: any = await app.mysql.query(
        'SELECT COUNT(*) AS c FROM message WHERE to_user_id = ? AND is_read = 0',
        [ userId ],
      );
      return Number(rows[0].c) || 0;
    } catch (err) {
      return 0;
    }
  }
}
