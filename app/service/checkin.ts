/* eslint-disable comma-dangle */
import { Service } from 'egg';

function formatDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default class checkin extends Service {
  // 打卡（同一天重复打卡返回 already）—— 直接更新 user 表，不再写 checkin 表
  public async checkin(userId) {
    const { app } = this;
    const today = formatDate(new Date());
    try {
      const user: any = await app.mysql.get('user', { userId });
      if (!user) return null;
      const lastDate = user.last_checkin_date
        ? formatDate(user.last_checkin_date instanceof Date ? user.last_checkin_date : new Date(user.last_checkin_date))
        : null;
      if (lastDate === today) {
        return { already: true, consecutive: Number(user.consecutive_days) || 0 };
      }
      // 计算连续天数：昨天打卡则 +1，否则重置为 1
      const yesterday = formatDate(new Date(Date.now() - 86400000));
      const consecutive = lastDate === yesterday ? Number(user.consecutive_days || 0) + 1 : 1;
      await app.mysql.update('user',
        {
          last_checkin_date: today,
          consecutive_days: consecutive,
          total_checkin: Number(user.total_checkin || 0) + 1,
        },
        { where: { userId } },
      );
      // 同步写 checkin 明细表：排行榜（周/月榜）按此表聚合打卡天数，
      // 之前停写后导致 rankingList 统计恒为 0。唯一键 uk_user_date 保证同日不重复。
      await app.mysql.query(
        'INSERT IGNORE INTO checkin (user_id, checkin_date, ctime) VALUES (?, ?, NOW())',
        [ userId, today ],
      );
      // 打卡 +5 积分
      await app.mysql.query('UPDATE user SET integral = integral + 5 WHERE userId = ?', [ userId ]);
      return { already: false, consecutive };
    } catch (err) {
      return null;
    }
  }

  // 连续打卡天数（直接读 user 表）
  public async consecutiveDays(userId) {
    const { app } = this;
    try {
      const user: any = await app.mysql.get('user', { userId });
      if (!user) return 0;
      // 如果最后打卡不是今天或昨天，连续天数已失效
      const today = formatDate(new Date());
      const yesterday = formatDate(new Date(Date.now() - 86400000));
      const lastDate = user.last_checkin_date
        ? formatDate(user.last_checkin_date instanceof Date ? user.last_checkin_date : new Date(user.last_checkin_date))
        : null;
      if (lastDate !== today && lastDate !== yesterday) return 0;
      return Number(user.consecutive_days) || 0;
    } catch (err) {
      return 0;
    }
  }

  // 打卡信息（直接读 user 表）
  public async getCheckinInfo(userId) {
    const { app } = this;
    try {
      const user: any = await app.mysql.get('user', { userId });
      if (!user) return null;
      const today = formatDate(new Date());
      const lastDate = user.last_checkin_date
        ? formatDate(user.last_checkin_date instanceof Date ? user.last_checkin_date : new Date(user.last_checkin_date))
        : null;
      return {
        todayChecked: lastDate === today,
        consecutive: await this.consecutiveDays(userId),
        total: Number(user.total_checkin) || 0,
      };
    } catch (err) {
      return null;
    }
  }
}
