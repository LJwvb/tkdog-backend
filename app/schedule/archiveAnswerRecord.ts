import { Subscription } from 'egg';

/**
 * 定时归档旧答题记录
 *
 * answer_record 表按月分区存储热数据（最近 90 天），超过 90 天的记录
 * 迁移到 answer_record_archive 归档表，避免主表无限膨胀。
 * 归档表保留完整数据，用户查看历史记录时可联合查询。
 *
 * schedule 说明：
 *  - interval: '1d'  每天执行一次（凌晨低峰期）
 *  - type: 'worker'  仅在单个 worker 上执行，避免多进程重复迁移
 */
export default class ArchiveAnswerRecord extends Subscription {
  static get schedule() {
    return {
      interval: '1d',
      type: 'worker',
      // 每天凌晨 3 点执行
      cron: '0 0 3 * * *',
    };
  }

  // 订阅执行：迁移超过 90 天的答题记录到归档表
  async subscribe() {
    const { app } = this;
    try {
      // 计算 90 天前的日期
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 90);
      const cutoffStr = cutoff.toISOString().slice(0, 19).replace('T', ' ');

      // 1. 查询需要归档的记录数
      const countResult: any = await app.mysql.query(
        'SELECT COUNT(*) as cnt FROM answer_record WHERE ctime < ?',
        [ cutoffStr ],
      );
      const total = Number(countResult[0]?.cnt || 0);
      if (total === 0) {
        app.logger.info('[archiveAnswerRecord] 无超过 90 天的答题记录，跳过');
        return;
      }

      app.logger.info(`[archiveAnswerRecord] 开始归档 ${total} 条超过 90 天的答题记录...`);

      // 2. 分批迁移（每批 1000 条，避免长事务锁表）
      const batchSize = 1000;
      let migrated = 0;
      while (migrated < total) {
        // 开启事务：先插入归档表，再删除主表记录
        const conn = await app.mysql.beginTransaction();
        try {
          // 查一批记录
          const rows: any = await conn.query(
            'SELECT * FROM answer_record WHERE ctime < ? ORDER BY id LIMIT ?',
            [ cutoffStr, batchSize ],
          );
          if (rows.length === 0) break;

          // 插入归档表
          const insertSql = `INSERT IGNORE INTO answer_record_archive
            (id, record_id, user_id, paper_id, question_id, user_answer, is_correct, ctime, score, max_score)
            VALUES ?`;
          const values = rows.map((r: any) => [
            r.id, r.record_id, r.user_id, r.paper_id, r.question_id,
            r.user_answer, r.is_correct, r.ctime, r.score, r.max_score,
          ]);
          await conn.query(insertSql, [ values ]);

          // 删除主表记录
          const ids = rows.map((r: any) => r.id);
          await conn.query('DELETE FROM answer_record WHERE id IN (?)', [ ids ]);

          await conn.commit();
          migrated += rows.length;
          app.logger.info(`[archiveAnswerRecord] 已归档 ${migrated}/${total} 条`);
          // 最后一批不足 batchSize 时提前退出，避免多一次空查询
          if (rows.length < batchSize) break;
        } catch (err) {
          await conn.rollback();
          app.logger.error('[archiveAnswerRecord] 批次迁移失败，回滚:', err);
          throw err;
        }
      }

      app.logger.info(`[archiveAnswerRecord] 归档完成，共迁移 ${migrated} 条记录到 answer_record_archive`);
    } catch (err) {
      app.logger.error('[archiveAnswerRecord] 归档任务失败:', err);
    }
  }
}
