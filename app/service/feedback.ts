/* eslint-disable comma-dangle */
import { Service } from 'egg';
import { getNowFormatDate } from '../utils';

export default class feedback extends Service {
  // 提交题目纠错反馈（同一用户对同一题目有未处理反馈时不重复提交）
  public async submitFeedback(params) {
    const { app } = this;
    const { userId, questionId, type, content } = params;
    try {
      const qid = Number(questionId);
      const existing = await app.mysql.get('question_feedback', {
        user_id: userId,
        question_id: qid,
        is_resolved: 0,
      });
      if (existing) return { duplicate: true };
      const result = await app.mysql.insert('question_feedback', {
        question_id: qid,
        user_id: userId,
        type: type || 'error',
        content: content || '',
        is_resolved: 0,
        ctime: getNowFormatDate(),
      });
      return result;
    } catch (err) {
      return null;
    }
  }
  // 反馈列表（管理员查看，分页）
  public async getFeedbackList(params) {
    const { app } = this;
    const { currentPage = 1, pageSize = 10 } = params || {};
    try {
      const result: any = await app.mysql.query(
        'SELECT f.*, u.username, q.question FROM question_feedback f ' +
          'LEFT JOIN user u ON f.user_id = u.userId ' +
          'LEFT JOIN questions q ON f.question_id = q.id ' +
          'ORDER BY f.id DESC LIMIT ? OFFSET ?',
        [ pageSize, (currentPage - 1) * pageSize ],
      );
      const totalRows: any = await app.mysql.query(
        'SELECT COUNT(*) AS count FROM question_feedback',
      );
      return { result, total: totalRows[0].count };
    } catch (err) {
      return null;
    }
  }
  // 标记反馈已处理（含处理备注与处理人）
  public async resolveFeedback(params) {
    const { app } = this;
    const { id, remark, resolver } = params;
    try {
      await app.mysql.update(
        'question_feedback',
        {
          is_resolved: 1,
          resolve_remark: remark || '',
          resolve_time: getNowFormatDate(),
          resolver: resolver || null,
        },
        { where: { id } },
      );
      const feedback: any = await app.mysql.get('question_feedback', { id });
      return { success: true, feedback };
    } catch (err) {
      return null;
    }
  }
  // 用户查看自己提交的反馈（分页）
  public async getMyFeedback(params) {
    const { app } = this;
    const { userId, currentPage = 1, pageSize = 10 } = params || {};
    try {
      const result: any = await app.mysql.query(
        'SELECT f.*, q.question FROM question_feedback f ' +
          'LEFT JOIN questions q ON f.question_id = q.id ' +
          'WHERE f.user_id = ? ORDER BY f.id DESC LIMIT ? OFFSET ?',
        [ userId, pageSize, (currentPage - 1) * pageSize ],
      );
      const totalRows: any = await app.mysql.query(
        'SELECT COUNT(*) AS count FROM question_feedback WHERE user_id = ?',
        [ userId ],
      );
      return { result, total: totalRows[0].count };
    } catch (err) {
      return null;
    }
  }
  // 未处理反馈数量（管理端角标）
  public async getUnresolvedCount() {
    const { app } = this;
    try {
      const rows: any = await app.mysql.query(
        'SELECT COUNT(*) AS count FROM question_feedback WHERE is_resolved = 0',
      );
      return rows[0].count;
    } catch (err) {
      return 0;
    }
  }
}
