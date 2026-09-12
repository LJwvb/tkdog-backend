import { Subscription } from 'egg';

/**
 * 定时清理「已中断」的连续打卡天数
 *
 * 背景：user.consecutive_days 是落库字段，用户断签后不会自动清零。
 *      若不清理，管理端列表直接读库会显示上一次的连续天数，
 *      而用户端接口经过失效判定返回 0，两端展示不一致。
 *
 * 判定规则：只有最后打卡日是「今天」或「昨天」，连续天数才有效；
 *          否则视为已中断，清零。
 *
 * 说明：service/checkin.ts 的 consecutiveDays() 已有「读时修复」兜底，
 *      本任务负责在无人访问时也把库值维护干净，保证任意时刻库值都可信。
 *
 * schedule 说明：
 *  - cron: '0 0 2 * * *'  每天凌晨 2:00 执行（错开其他整点任务）
 *  - type: 'worker'       仅在单个 worker 上执行，避免多进程重复清理
 */
export default class CleanStaleConsecutiveDays extends Subscription {
  static get schedule() {
    return {
      cron: '0 0 2 * * *',
      type: 'worker',
    };
  }

  // 订阅执行：把断签用户的连续天数清零
  async subscribe() {
    const { app } = this;
    try {
      const result: any = await app.mysql.query(
        'UPDATE user SET consecutive_days = 0 ' +
          'WHERE consecutive_days > 0 ' +
          'AND (last_checkin_date IS NULL ' +
          'OR last_checkin_date NOT IN (CURDATE(), DATE_SUB(CURDATE(), INTERVAL 1 DAY)))',
      );
      if (result && Number(result.affectedRows) > 0) {
        app.logger.info(
          `[cleanStaleConsecutiveDays] 清理已中断的连续打卡天数 ${result.affectedRows} 条`,
        );
      }
    } catch (err) {
      app.logger.error('[cleanStaleConsecutiveDays] 清理连续打卡天数失败:', err);
    }
  }
}
