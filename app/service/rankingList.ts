import { Service } from 'egg';

export default class RankingList extends Service {
  public async getRankingList(type = 'all', page = 1, pageSize = 20) {
    const { app } = this;
    try {
      // 时间范围：week=近7天 / month=近30天 / all=全部
      let since: string | undefined;
      if (type === 'week' || type === 'month') {
        const d = new Date();
        d.setDate(d.getDate() - (type === 'week' ? 7 : 30));
        since = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }

      // 1. 只查未删除用户的基本信息（过滤已删除用户）
      const users: any = await app.mysql.query(
        'SELECT userId, username, avatar FROM user WHERE is_deleted = 0',
      );

      // 2. 批量聚合：上传/审核通过/获赞（替代原 N+1 逐个 computePoints）
      const uploadSinceCond = since ? ' AND q.addDate >= ?' : '';
      const uploadParams: any[] = since ? [ since ] : [];
      const uploadRows: any = await app.mysql.query(
        'SELECT uq.user_id, COUNT(*) AS upload, ' +
          'COALESCE(SUM(CASE WHEN q.chkState=1 THEN 1 ELSE 0 END),0) AS approved, ' +
          'COALESCE(SUM(q.likes_num),0) AS likes ' +
          'FROM user_upload_question uq JOIN questions q ON uq.question_id = q.id ' +
          `WHERE q.is_deleted = 0${uploadSinceCond} GROUP BY uq.user_id`,
        uploadParams,
      );
      const uploadMap = new Map<number, any>();
      uploadRows.forEach((r: any) => uploadMap.set(Number(r.user_id), r));

      // 3. 批量聚合：答对题数
      const correctSinceCond = since ? ' AND ctime >= ?' : '';
      const correctParams: any[] = since ? [ since ] : [];
      const correctRows: any = await app.mysql.query(
        `SELECT user_id, COUNT(*) AS count FROM answer_record WHERE is_correct = 1${correctSinceCond} GROUP BY user_id`,
        correctParams,
      );
      const correctMap = new Map<number, number>();
      correctRows.forEach((r: any) =>
        correctMap.set(Number(r.user_id), Number(r.count) || 0),
      );

      // 4. 批量聚合：打卡天数
      const checkinSinceCond = since ? ' AND ctime >= ?' : '';
      const checkinParams: any[] = since ? [ since ] : [];
      const checkinRows: any = await app.mysql.query(
        `SELECT user_id, COUNT(*) AS count FROM checkin WHERE 1=1${checkinSinceCond} GROUP BY user_id`,
        checkinParams,
      );
      const checkinMap = new Map<number, number>();
      checkinRows.forEach((r: any) =>
        checkinMap.set(Number(r.user_id), Number(r.count) || 0),
      );

      // 5. 内存合并计算积分（公式与 computePoints 保持一致：上传×2 + 审核通过×5 + 答对×1 + 打卡×5）
      const list: any[] = [];
      for (const u of users) {
        const uid = Number(u.userId);
        const up = uploadMap.get(uid);
        const upload = Number(up?.upload) || 0;
        const approved = Number(up?.approved) || 0;
        const likes = Number(up?.likes) || 0;
        const correct = correctMap.get(uid) || 0;
        const checkin = checkinMap.get(uid) || 0;
        const integral = approved * 5 + upload * 2 + correct + checkin * 5;
        // 只展示有活跃数据的用户（与原逻辑一致）
        if (integral > 0 || upload > 0 || likes > 0) {
          list.push({
            username: u.username,
            avatar: u.avatar,
            upload_ques_num: upload,
            get_likes_num: likes,
            correct_ques_num: correct,
            checkin_days: checkin,
            integral,
          });
        }
      }
      list.sort((a, b) => b.integral - a.integral);
      const total = list.length;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const pagedList = list.slice(start, end);
      return {
        list: pagedList,
        total,
        page,
        pageSize,
        hasMore: end < total,
      };
    } catch (err) {
      return null;
    }
  }
}
