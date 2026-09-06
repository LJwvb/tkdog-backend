import { Service } from 'egg';

export default class favorite extends Service {
  // 收藏题目
  public async add(userId: number, questionId: number) {
    const { app } = this;
    const conn = await app.mysql.beginTransaction();
    try {
      const result: any = await conn.insert('user_favorite_question', {
        user_id: userId,
        question_id: questionId,
        create_time: new Date(),
      });
      // 收藏成功后再累加题目收藏数，避免重复收藏导致计数虚增
      if (result?.affectedRows > 0) {
        await conn.query(
          'UPDATE questions SET favorite_num = favorite_num + 1 WHERE id = ?',
          [ questionId ],
        );
      }
      await conn.commit();
      return result;
    } catch (err) {
      await conn.rollback();
      return null;
    }
  }
  // 取消收藏
  public async remove(userId: number, questionId: number) {
    const { app } = this;
    const conn = await app.mysql.beginTransaction();
    try {
      const result: any = await conn.delete('user_favorite_question', {
        user_id: userId,
        question_id: questionId,
      });
      // 确实取消了收藏才自减，且不低于 0
      if (result?.affectedRows > 0) {
        await conn.query(
          'UPDATE questions SET favorite_num = GREATEST(favorite_num - 1, 0) WHERE id = ?',
          [ questionId ],
        );
      }
      await conn.commit();
      return result;
    } catch (err) {
      await conn.rollback();
      return null;
    }
  }
  // 我的收藏列表（关联题目表返回完整题目）
  public async getList(userId: number) {
    const { app } = this;
    try {
      const result = await app.mysql.query(
        'SELECT q.* FROM user_favorite_question f ' +
          'JOIN questions q ON f.question_id = q.id ' +
          'WHERE f.user_id = ? AND q.is_deleted = 0 ORDER BY f.create_time DESC',
        [ userId ],
      );
      return result;
    } catch (err) {
      return null;
    }
  }
  // 是否已收藏
  public async isFavorite(userId: number, questionId: number): Promise<boolean> {
    const { app } = this;
    try {
      const row = await app.mysql.get('user_favorite_question', {
        user_id: userId,
        question_id: questionId,
      });
      return Boolean(row);
    } catch (err) {
      return false;
    }
  }
}
