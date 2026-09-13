import { Subscription } from 'egg';
import fs from 'fs';
import path from 'path';

/**
 * 整库备份提醒（每日凌晨 4 点执行）
 *
 * 检查项目根目录下最近 7 天内是否有 .sql 备份文件（如 tkdog.sql / backup_*.sql），
 * 没有则打 ERROR 日志提醒人工备份，避免数据丢失后无可用备份。
 * 注意：只做检查与告警，不自动备份（备份策略/目标由部署方决定）。
 */
export default class BackupReminder extends Subscription {
  static get schedule() {
    return {
      interval: '1d',
      type: 'worker',
      cron: '0 0 4 * * *',
    };
  }

  async subscribe() {
    const { app } = this;
    try {
      const root = app.baseDir;
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
      let latest = 0;
      let found = 0;
      for (const name of fs.readdirSync(root)) {
        if (!/\.sql$/i.test(name)) continue;
        found += 1;
        const st = fs.statSync(path.join(root, name));
        const mt = st.mtime ? st.mtime.getTime() : 0;
        if (mt > latest) latest = mt;
      }
      if (found === 0 || latest < cutoff) {
        app.logger.error(
          '[backupReminder] 近 7 天未发现整库 .sql 备份，请尽快执行 mysqldump 备份（数据库：tkdog）',
        );
        return;
      }
      app.logger.info('[backupReminder] 最近备份文件在 7 天内，无需告警');
    } catch (err) {
      app.logger.error('[backupReminder] 检查备份失败:', err);
    }
  }
}
