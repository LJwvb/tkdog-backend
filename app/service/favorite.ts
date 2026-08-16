import { Service } from 'egg';

export default class favorite extends Service {
  // 收藏题目
  public async add(userId: number, questionId: number) {
    const { app } = this;
    try {
      const result = await app.mysql.insert('user_favorite_question', {
        user_id: userId,
        question_id: questionId,
        create_time: new Date(),
      });
      return result;
    } catch (err) {
      return null;
    }
  }
  // 取消收藏
  public async remove(userId: number, questionId: number) {
    const { app } = this;
    try {
      const result = await app.mysql.delete('user_favorite_question', {
        user_id: userId,
        question_id: questionId,
      });
      return result;
    } catch (err) {
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
