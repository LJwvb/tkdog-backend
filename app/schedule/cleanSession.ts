import { Subscription } from 'egg';

/**
 * 定时清理过期的 session 记录
 *
 * session 表存储框架会话（cookie EGG_SESS），其中已过期的数据不再被使用，
 * 长期累积会占用存储并拖慢扫描。该任务每小时清理一次过期记录。
 *
 * schedule 说明：
 *  - interval: '1h'  每 1 小时执行一次
 *  - type: 'worker'  仅在单个 worker 上执行，避免多进程重复清理
 */
export default class CleanSession extends Subscription {
  static get schedule() {
    return {
      interval: '1h',
      type: 'worker',
    };
  }

  // 订阅执行：删除所有已过期的 session
  async subscribe() {
    const { app } = this;
    try {
      // expire_at 为毫秒时间戳，小于当前时间的即为过期
      const result: any = await app.mysql.query(
        'DELETE FROM session WHERE expire_at IS NOT NULL AND expire_at < ?',
        [ Date.now() ],
      );
      if (result && Number(result.affectedRows) > 0) {
        app.logger.info(
          `[cleanSession] 清理过期 session ${result.affectedRows} 条`,
        );
      }
    } catch (err) {
      app.logger.error('[cleanSession] 清理过期 session 失败:', err);
    }
  }
}
