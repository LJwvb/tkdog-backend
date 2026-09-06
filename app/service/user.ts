import { Service } from 'egg';
import { createMathExpr } from 'svg-captcha';
import md5 from 'md5';
import bcrypt from 'bcryptjs';
import { getNowFormatDate } from '../utils';

interface LoginParams {
  password: string; // 密码
  phone: string; // 手机号
}
interface RegisterParams {
  username: string; // 用户名
  password: string; // 密码
  phone: string; // 手机号
  sex: string; // 性别
  email: string; // 邮箱
  ctime: string; // 创建时间
  avatar: string; // 头像
  last_login_time: string; // 最后登录时间
  [key: string]: any; // 其他字段
}
interface CaptchaParams {
  width: number; // 宽度
  height: number; // 高度
  fontSize?: number; // 字体大小
  noise?: number; // 干扰线条的数量
  color?: boolean; // 验证码的字符是否有颜色
  background?: string; // 验证码图片背景颜色
}

// 登录接口限流（按 IP 滑动窗口，防暴力破解；单进程有效）
const loginWindows = new Map<string, number[]>();

export default class User extends Service {
  // 登录是否触发限流（按 IP 滑动窗口）
  public isLoginRateLimited(ip: string | undefined): boolean {
    const windowMs = 60000;
    const max = 20;
    const now = Date.now();
    const key = ip || 'unknown';
    const arr = (loginWindows.get(key) || []).filter(t => now - t < windowMs);
    if (arr.length >= max) {
      loginWindows.set(key, arr);
      return true;
    }
    arr.push(now);
    loginWindows.set(key, arr);
    // 定期清理过期 key，防止长期运行内存增长（单进程内存限流）
    if (loginWindows.size > 500) {
      for (const [ k, v ] of loginWindows) {
        const fresh = v.filter(t => now - t < windowMs);
        if (fresh.length === 0) {
          loginWindows.delete(k);
        } else {
          loginWindows.set(k, fresh);
        }
      }
    }
    return false;
  }

  // 登录
  public async login(params: LoginParams) {
    const { app } = this;
    try {
      // 先按手机号查用户（不限制 is_deleted，以便区分"不存在"和"已删除"）
      const result: any = await app.mysql.get('user', {
        phone: params.phone,
      });
      if (!result) return null;
      // 已删除账号：返回特殊标记，提示因违规被删除
      if (result.is_deleted === 1 || result.is_deleted === '1') {
        return { deleted: true };
      }

      let passwordOk = false;
      try {
        passwordOk = await bcrypt.compare(params.password, result.password);
      } catch {
        passwordOk = false;
      }
      if (!passwordOk) {
        // 回退旧 md5 校验，匹配成功后自动升级为 bcrypt
        const legacy = md5(md5(params.password));
        if (legacy === result.password) {
          passwordOk = true;
          const hashed = await bcrypt.hash(params.password, 10);
          await app.mysql.update(
            'user',
            { password: hashed },
            { where: { phone: params.phone } },
          );
        }
      }
      if (!passwordOk) return null;

      // 更新登录时间
      await app.mysql.update(
        'user',
        {
          last_login_time: getNowFormatDate(),
        },
        {
          where: { phone: params.phone },
        },
      );
      // 查询点赞题目 ID（关联表），返回逗号分隔字符串保持前端兼容
      const likes: any = await app.mysql.query(
        'SELECT question_id FROM user_like_question WHERE user_id = ?',
        [ result.userId ],
      );
      const likeIds = likes.map((l: any) => l.question_id);
      result.likeTopicsId = likeIds.length ? ',' + likeIds.join(',') : '';
      return result;
    } catch (err) {
      return null;
    }
  }
  // 注册
  public async register(params: RegisterParams) {
    const { app } = this;
    try {
      // 密码 bcrypt 加密
      params.password = await bcrypt.hash(params.password, 10);
      const result = await app.mysql.insert('user', params);
      return result;
    } catch (err) {
      return null;
    }
  }
  // 重置密码（按手机号定位）
  public async resetPassword(params) {
    const { app } = this;
    const { phone, password } = params;
    try {
      const user: any = await app.mysql.get('user', { phone });
      if (!user) return null;
      const hashed = await bcrypt.hash(password, 10);
      const result = await app.mysql.update(
        'user',
        { password: hashed },
        { where: { userId: user.userId } },
      );
      return result;
    } catch (err) {
      return null;
    }
  }
  // 获取用户信息（支持按 userId / phone / username 查询，统一附加实时统计）
  public async getUserInfo(params) {
    const { app } = this;
    const { phone, username, userId } = params;
    try {
      let result: any = null;
      if (userId) {
        result = await app.mysql.get('user', { userId, is_deleted: 0 });
      } else if (phone) {
        result = await app.mysql.get('user', { phone, is_deleted: 0 });
      } else if (username) {
        result = await app.mysql.get('user', { username, is_deleted: 0 });
      }
      if (!result) return null;

      // 实时统计：上传数、获赞数、审核通过数（按唯一 user_id 关联 user_upload_question，避免用户名修改后统计错乱）
      const stats = await app.mysql.query(
        'SELECT COUNT(*) AS upload_ques_num, ' +
          'COALESCE(SUM(q.likes_num),0) AS like_ques_num, ' +
          'COALESCE(SUM(CASE WHEN q.chkState=1 THEN 1 ELSE 0 END), 0) AS approvedNums ' +
          'FROM user_upload_question uq JOIN questions q ON uq.question_id = q.id ' +
          'WHERE uq.user_id = ? AND q.is_deleted = 0',
        [ result.userId ],
      );
      result.upload_ques_num = stats[0].upload_ques_num;
      result.like_ques_num = stats[0].like_ques_num;
      result.approvedNums = stats[0].approvedNums;
      // 查询点赞题目 ID（关联表），返回逗号分隔字符串保持前端兼容
      const likes: any = await app.mysql.query(
        'SELECT question_id FROM user_like_question WHERE user_id = ?',
        [ result.userId ],
      );
      const likeIds = likes.map((l: any) => l.question_id);
      result.likeTopicsId = likeIds.length ? ',' + likeIds.join(',') : '';

      // 积分直接读落库字段，答题/打卡数仍实时计算
      result.integral = Number(result.integral ?? 0);
      const points = await this.computePoints(result.userId);
      result.correct_ques_num = points.correct;
      result.checkin_days = points.checkin;
      // 每日目标：目标值 + 今日答对数
      result.daily_goal = Number(result.daily_goal) || 0;
      const todayRows: any = await app.mysql.query(
        'SELECT COUNT(*) AS c FROM answer_record WHERE user_id = ? AND is_correct = 1 AND DATE(ctime) = CURDATE()',
        [ result.userId ],
      );
      result.today_correct = Number(todayRows[0].c) || 0;

      return result;
    } catch (err) {
      return null;
    }
  }
  // 实时计算用户积分（上传×2 + 审核通过×5 + 答对×1 + 打卡×5）
  // since 可选：只统计该时间之后的记录（用于周榜/月榜）
  public async computePoints(userId, since?: string) {
    const { app } = this;
    try {
      const user: any = await app.mysql.get('user', { userId });
      if (!user) {
        return { upload: 0, approved: 0, likes: 0, correct: 0, checkin: 0, integral: 0 };
      }
      const sinceCond = since ? ' AND q.addDate >= ?' : '';
      const statsParams: any = since ? [ userId, since ] : [ userId ];
      const stats: any = await app.mysql.query(
        'SELECT COUNT(*) AS upload, ' +
          'COALESCE(SUM(CASE WHEN q.chkState=1 THEN 1 ELSE 0 END),0) AS approved, ' +
          'COALESCE(SUM(q.likes_num),0) AS likes ' +
          'FROM user_upload_question uq JOIN questions q ON uq.question_id = q.id ' +
          `WHERE uq.user_id = ? AND q.is_deleted = 0${sinceCond}`,
        statsParams,
      );
      const correctCond = since ? ' AND ctime >= ?' : '';
      const correctParams: any = since ? [ userId, since ] : [ userId ];
      const correctRows: any = await app.mysql.query(
        `SELECT COUNT(*) AS count FROM answer_record WHERE user_id = ? AND is_correct = 1${correctCond}`,
        correctParams,
      );
      // 打卡数：无时间筛选时直接读 user.total_checkin（落库字段），有筛选时查历史 checkin 表
      let checkin = 0;
      if (since) {
        const checkinRows: any = await app.mysql.query(
          'SELECT COUNT(*) AS count FROM checkin WHERE user_id = ? AND ctime >= ?',
          [ userId, since ],
        );
        checkin = Number(checkinRows[0]?.count) || 0;
      } else {
        checkin = Number(user.total_checkin) || 0;
      }
      const upload = Number(stats[0].upload) || 0;
      const approved = Number(stats[0].approved) || 0;
      const likes = Number(stats[0].likes) || 0;
      const correct = Number(correctRows[0].count) || 0;
      const integral = approved * 5 + upload * 2 + correct * 1 + checkin * 5;
      return { upload, approved, likes, correct, checkin, integral };
    } catch (err) {
      return { upload: 0, approved: 0, likes: 0, correct: 0, checkin: 0, integral: 0 };
    }
  }
  // 公开主页信息（查看他人主页，不含敏感字段）
  public async getPublicProfile(targetUserId, viewerUserId) {
    const { app } = this;
    try {
      const user: any = await app.mysql.get('user', {
        userId: targetUserId,
        is_deleted: 0,
      });
      if (!user) return null;
      delete user.password;
      delete user.phone;
      delete user.email;
      const points = await this.computePoints(targetUserId);
      user.integral = points.integral;
      user.correct_ques_num = points.correct;
      user.checkin_days = points.checkin;
      const stats: any = await app.mysql.query(
        'SELECT COUNT(*) AS upload, COALESCE(SUM(q.likes_num),0) AS likes ' +
          'FROM user_upload_question uq JOIN questions q ON uq.question_id = q.id ' +
          'WHERE uq.user_id = ? AND q.is_deleted = 0',
        [ targetUserId ],
      );
      user.upload_ques_num = Number(stats[0].upload) || 0;
      user.like_ques_num = Number(stats[0].likes) || 0;
      const counts = await this.service.follow.getCounts(targetUserId);
      user.following = counts.following;
      user.followers = counts.followers;
      user.is_following = viewerUserId
        ? await this.service.follow.isFollowing(viewerUserId, targetUserId)
        : false;
      return user;
    } catch (err) {
      return null;
    }
  }
  // 设置每日答题目标
  public async setDailyGoal(userId: number, goal: number) {
    const { app } = this;
    try {
      const result = await app.mysql.update(
        'user',
        { daily_goal: goal },
        { where: { userId } },
      );
      return result;
    } catch (err) {
      return null;
    }
  }
  // 更新用户信息（按 userId 定位，不依赖 phone）
  public async updateUserInfo(params): Promise<any> {
    const { app } = this;

    try {
      const { userId, ...updateData } = params;
      if (updateData.password) {
        // 密码 bcrypt 加密
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }
      // 用户名唯一性检测：排除当前用户自身
      if (updateData.username) {
        const dup: any = await app.mysql.get('user', { username: updateData.username });
        if (dup && Number(dup.userId) !== Number(userId)) {
          return { duplicate: true };
        }
      }
      const result = await app.mysql.update('user', updateData, {
        where: { userId },
      });
      return result;
    } catch (err) {
      return null;
    }
  }

  // 验证码
  public async captcha(params: CaptchaParams) {
    const {
      width,
      height,
      fontSize = 36,
      noise = 4,
      color = true,
      background,
    } = params;
    if (!width || !height) {
      return 'width and height are required';
    }

    const { data, text } = createMathExpr({
      size: 4,
      ignoreChars: '0o1i',
      width,
      height,
      fontSize,
      noise,
      color,
      background,
    });

    return {
      data,
      // 归一化后存 md5：与 ctx.verifyCaptcha 的比对规则保持一致
      text: md5(String(text).trim().toLowerCase()),
    };
  }
  // 获取用户上传的题目
  public async getUserUploadQues(params) {
    const { app } = this;
    const { userId, currentPage, pageSize, chkState } = params;
    try {
      // 通过 user_upload_question 关联表按 userId 查用户上传的题目
      const result: any = await app.mysql.query(
        'SELECT q.* FROM user_upload_question uq ' +
          'JOIN questions q ON uq.question_id = q.id ' +
          'WHERE uq.user_id = ? AND q.chkState = ? AND q.is_deleted = 0 ' +
          'LIMIT ? OFFSET ?',
        [ userId, chkState, pageSize, (currentPage - 1) * pageSize ],
      );
      const totalRows: any = await app.mysql.query(
        'SELECT COUNT(*) AS count FROM user_upload_question uq ' +
          'JOIN questions q ON uq.question_id = q.id ' +
          'WHERE uq.user_id = ? AND q.chkState = ? AND q.is_deleted = 0',
        [ userId, chkState ],
      );
      return {
        total: totalRows[0].count,
        data: result,
      };
    } catch (err) {
      return null;
    }
  }
}
