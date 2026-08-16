'use strict';

/**
 * 自定义 session 存储：写入 MySQL，使 cluster 多进程共享登录态，
 * 避免内存 store 在各 worker 独立导致登录态串号 / 丢失。
 */
class MySQLSessionStore {
  constructor(app) {
    this.app = app;
  }

  async get(sid) {
    try {
      const row = await this.app.mysql.get('session', { id: sid });
      if (!row) return null;
      // 过期即失效
      if (row.expire_at && Date.now() > Number(row.expire_at)) {
        await this.app.mysql.delete('session', { id: sid });
        return null;
      }
      return row.data ? JSON.parse(row.data) : null;
    } catch (err) {
      return null;
    }
  }

  async set(sid, value, maxAge) {
    try {
      const expireAt = maxAge ? Date.now() + Number(maxAge) : null;
      const data = JSON.stringify(value || {});
      await this.app.mysql.query(
        'REPLACE INTO session (id, data, expire_at, update_at) VALUES (?, ?, ?, NOW())',
        [ sid, data, expireAt ],
      );
    } catch (err) {
      // 忽略写入异常，避免影响请求
    }
  }

  async destroy(sid) {
    try {
      await this.app.mysql.delete('session', { id: sid });
    } catch (err) {
      // 忽略
    }
  }
}

module.exports = app => {
  app.sessionStore = new MySQLSessionStore(app);
};
