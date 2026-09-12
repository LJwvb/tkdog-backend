/* eslint-disable comma-dangle */
import { Service } from 'egg';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

// 仅到「日」，用于判断是否为同一天（打卡去重依据）
function formatDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// 精确到「秒」，用于记录/展示打卡时刻
function formatDateTime(d: Date): string {
  return `${formatDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(
    d.getSeconds(),
  )}`;
}

// 把 Date | string 统一格式化为「日」，便于比较
function toDay(v: Date | string | null | undefined): string | null {
  if (!v) return null;
  return formatDate(v instanceof Date ? v : new Date(v));
}

// 把 Date | string 统一格式化为「秒」，便于返回
function toSecond(v: Date | string | null | undefined): string | null {
  if (!v) return null;
  return formatDateTime(v instanceof Date ? v : new Date(v));
}

/**
 * 计算「当前仍然有效」的连续打卡天数。
 *
 * 规则：只有最后打卡日是今天或昨天，连续天数才有效；否则视为已中断，返回 0。
 * 说明：user.consecutive_days 是落库字段，中断后不会自动清零，
 *      因此用户端与管理端都必须经此函数过滤，避免两边展示不一致。
 *
 * @param lastCheckinDate user.last_checkin_date（Date 或字符串）
 * @param consecutiveDays user.consecutive_days（库中残值）
 */
export function effectiveConsecutiveDays(
  lastCheckinDate: Date | string | null | undefined,
  consecutiveDays: unknown,
): number {
  const today = formatDate(new Date());
  const yesterday = formatDate(new Date(Date.now() - 86400000));
  const lastDate = toDay(lastCheckinDate);
  if (lastDate !== today && lastDate !== yesterday) return 0;
  return Number(consecutiveDays) || 0;
}

export default class checkin extends Service {
  // 打卡（同一天重复打卡返回 already）—— 全部落在 user 表，不再有 checkin 明细表
  public async checkin(userId) {
    const { app } = this;
    const now = new Date();
    const today = formatDate(now); // 去重按「天」
    const nowTime = formatDateTime(now); // 打卡时刻精确到秒
    try {
      const user: any = await app.mysql.get('user', { userId });
      if (!user) return null;
      const lastDate = toDay(user.last_checkin_date);
      if (lastDate === today) {
        // 已打卡：连续天数复用 consecutiveDays()，其中会把中断残值真正清零写回库
        const consecutive = await this.consecutiveDays(userId);
        return {
          already: true,
          consecutive,
          checkinTime: toSecond(user.last_checkin_time) || nowTime,
        };
      }
      // 计算连续天数：昨天打卡则 +1，否则重置为 1
      const yesterday = formatDate(new Date(Date.now() - 86400000));
      const consecutive = lastDate === yesterday ? Number(user.consecutive_days || 0) + 1 : 1;
      await app.mysql.update('user',
        {
          last_checkin_date: today,
          last_checkin_time: nowTime,
          consecutive_days: consecutive,
          total_checkin: Number(user.total_checkin || 0) + 1,
        },
        { where: { userId } },
      );
      // 打卡 +5 积分
      await app.mysql.query('UPDATE user SET integral = integral + 5 WHERE userId = ?', [ userId ]);
      return { already: false, consecutive, checkinTime: nowTime };
    } catch (err) {
      return null;
    }
  }

  // 连续打卡天数（读 user 表；若已中断则把库中残值真正清零，保证库值与两端展示一致）
  public async consecutiveDays(userId) {
    const { app } = this;
    try {
      const user: any = await app.mysql.get('user', { userId });
      if (!user) return 0;
      const effective = effectiveConsecutiveDays(user.last_checkin_date, user.consecutive_days);
      // 库中残值与有效值不一致（说明连续已中断但没清），这里真正写回 0
      if (effective === 0 && Number(user.consecutive_days) !== 0) {
        await app.mysql.update('user', { consecutive_days: 0 }, { where: { userId } });
      }
      return effective;
    } catch (err) {
      return 0;
    }
  }

  // 打卡信息（全部读 user 表，无明细表）
  public async getCheckinInfo(userId) {
    const { app } = this;
    try {
      const user: any = await app.mysql.get('user', { userId });
      if (!user) return null;
      const today = formatDate(new Date());
      const todayChecked = toDay(user.last_checkin_date) === today;
      // 打卡时刻统一存于 user.last_checkin_time（精确到秒）
      const lastCheckinTime = toSecond(user.last_checkin_time);
      return {
        todayChecked,
        consecutive: await this.consecutiveDays(userId),
        total: Number(user.total_checkin) || 0,
        // 今日打卡时刻（未打卡为 null），前端可展示「今日已打卡 15:26:42」
        todayCheckinTime: todayChecked ? lastCheckinTime : null,
        lastCheckinTime,
      };
    } catch (err) {
      return null;
    }
  }
}
