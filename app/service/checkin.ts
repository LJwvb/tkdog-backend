/* eslint-disable comma-dangle */
import { Service } from 'egg';
import { getNowFormatDate } from '../utils';

function formatDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default class checkin extends Service {
  // 打卡（同一天重复打卡返回 already）
  public async checkin(userId) {
    const { app } = this;
    const date = formatDate(new Date());
    try {
      const existing = await app.mysql.get('checkin', {
        user_id: userId,
        checkin_date: date,
      });
      if (existing) {
        return { already: true, consecutive: await this.consecutiveDays(userId) };
      }
      await app.mysql.insert('checkin', {
        user_id: userId,
        checkin_date: date,
        ctime: getNowFormatDate(),
      });
      return { already: false, consecutive: await this.consecutiveDays(userId) };
    } catch (err) {
      return null;
    }
  }
  // 连续打卡天数
  public async consecutiveDays(userId) {
    const { app } = this;
    try {
      const rows: any = await app.mysql.query(
        'SELECT DISTINCT checkin_date FROM checkin WHERE user_id = ? ORDER BY checkin_date DESC',
        [ userId ],
      );
      const dates = new Set(rows.map((r: any) => r.checkin_date));
      let cursor = new Date();
      // 今天未打卡时，从昨天开始连续计数
      if (!dates.has(formatDate(cursor))) {
        cursor = new Date(cursor.getTime() - 86400000);
      }
      let consecutive = 0;
      while (dates.has(formatDate(cursor))) {
        consecutive++;
        cursor = new Date(cursor.getTime() - 86400000);
      }
      return consecutive;
    } catch (err) {
      return 0;
    }
  }
  // 打卡信息
  public async getCheckinInfo(userId) {
    const { app } = this;
    try {
      const today = formatDate(new Date());
      const row = await app.mysql.get('checkin', {
        user_id: userId,
        checkin_date: today,
      });
      const totalRows: any = await app.mysql.query(
        'SELECT COUNT(*) AS count FROM checkin WHERE user_id = ?',
        [ userId ],
      );
      return {
        todayChecked: Boolean(row),
        consecutive: await this.consecutiveDays(userId),
        total: Number(totalRows[0].count) || 0,
      };
    } catch (err) {
      return null;
    }
  }
}
