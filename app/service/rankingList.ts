import { Service } from 'egg';

export default class RankingList extends Service {
  public async getRankingList(type = 'all') {
    const { app } = this;
    try {
      // 时间范围：week=近7天 / month=近30天 / all=全部
      let since: string | undefined;
      if (type === 'week' || type === 'month') {
        const d = new Date();
        d.setDate(d.getDate() - (type === 'week' ? 7 : 30));
        since = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
      // 实时聚合积分：上传×2 + 审核通过×5 + 答对×1 + 打卡×5
      const users: any = await app.mysql.query(
        'SELECT userId, username, avatar FROM user',
      );
      const list: any[] = [];
      for (const u of users) {
        const p: any = await this.service.user.computePoints(u.userId, since);
        if (p.integral > 0 || p.upload > 0 || p.likes > 0) {
          list.push({
            username: u.username,
            avatar: u.avatar,
            upload_ques_num: p.upload,
            get_likes_num: p.likes,
            correct_ques_num: p.correct,
            checkin_days: p.checkin,
            integral: p.integral,
          });
        }
      }
      list.sort((a, b) => b.integral - a.integral);
      return list;
    } catch (err) {
      return null;
    }
  }
}
