import { Controller } from 'egg';
import { getNowFormatDate, removePassword } from '../utils';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt';

export default class User extends Controller {
  // 登录
  public async login() {
    const { ctx } = this;
    const { password, phone, code } = ctx.request.body;
    if (!phone || !password) {
      ctx.fail('账号密码不能为空');
      return;
    }
    // 图形验证码服务端校验（一次性）
    if (!ctx.verifyCaptcha(code)) {
      ctx.fail('验证码错误或已过期，请重新获取');
      return;
    }
    // 防暴力破解：按 IP 限流
    if (ctx.service.user.isLoginRateLimited(ctx.ip)) {
      ctx.fail('登录过于频繁，请稍后再试');
      return;
    }
    const data = await ctx.service.user.login({ password, phone });

    if ((data as any)?.deleted) {
      ctx.fail('账号因违规已被限制登录, 无法继续使用');
      return;
    }
    if (data) {
      // 生成双 Token（accessToken 24h，refreshToken 7d），携带 tokenVersion
      const { accessToken, refreshToken } = generateTokenPair({
        userId: data.userId,
        username: data.username,
        tokenVersion: (data as any).token_version ?? 0,
      });
      await ctx.service.user.updateUserInfo({
        last_login_time: getNowFormatDate(),
        userId: data.userId,
      });
      // 去除密码，返回用户信息 + 双 token
      const returnData = removePassword(data);
      ctx.success({ ...returnData, token: accessToken, accessToken, refreshToken }, '登录成功');
    } else {
      ctx.fail('账号或密码错误，登录失败');
    }
  }
  // 退出登录（同时清除普通用户 session 与管理员 cookie）
  public async logout() {
    const { ctx } = this;
    ctx.session = null;
    ctx.cookies.set('ADMIN_SESS', '', {
      signed: true,
      maxAge: 0,
      overwrite: true,
    });
    ctx.success(null, '退出成功');
  }
  // 刷新 Token（无感刷新：accessToken 过期后用 refreshToken 换新的双 token）
  public async refreshToken() {
    const { ctx } = this;
    const { refreshToken } = ctx.request.body;
    if (!refreshToken) {
      ctx.fail('缺少 refreshToken');
      return;
    }
    // 验证 refreshToken（必须是 refresh 类型且未过期）
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      ctx.unauthorized('登录已过期，请重新登录');
      return;
    }
    // 从数据库查询最新的 tokenVersion，比对是否一致
    const user = await ctx.app.mysql.get('user', { userId: payload.userId });
    const dbTokenVersion = (user as any)?.token_version ?? 0;
    // tokenVersion 不匹配说明账号已删除或修改密码，旧 refreshToken 失效
    if (dbTokenVersion !== (payload.tokenVersion ?? 0)) {
      ctx.unauthorized('登录已过期，请重新登录');
      return;
    }
    // 生成新的双 token，携带最新的 tokenVersion
    const { accessToken, refreshToken: newRefreshToken } = generateTokenPair({
      userId: payload.userId,
      username: payload.username,
      tokenVersion: dbTokenVersion,
    });
    ctx.success({ accessToken, refreshToken: newRefreshToken }, 'Token 刷新成功');
  }
  // 查看他人公开主页
  public async getPublicProfile() {
    const { ctx } = this;
    const { userId: targetUserId } = ctx.request.body;
    if (!targetUserId) {
      ctx.fail('参数不完整~');
      return;
    }
    const result = await ctx.service.user.getPublicProfile(
      Number(targetUserId),
      ctx.currentUserId(),
    );
    if (result) {
      ctx.success(result, '请求成功');
    } else {
      ctx.fail('用户不存在~');
    }
  }
  // 设置每日答题目标
  public async setDailyGoal() {
    const { ctx } = this;
    const { goal } = ctx.request.body;
    const g = Number(goal);
    if (Number.isNaN(g) || g < 0) {
      ctx.fail('目标值不合法~');
      return;
    }
    const userId = ctx.currentUserId();
    if (!userId) {
      ctx.unauthorized();
      return;
    }
    const result = await ctx.service.user.setDailyGoal(userId, g);
    if (result) {
      ctx.success(null, '目标已保存~');
    } else {
      ctx.fail('保存失败~');
    }
  }
  // 重置密码（忘记密码：按手机号 + 图形验证码重置，防止被恶意重置他人密码）
  public async resetPassword() {
    const { ctx } = this;
    const { phone, password, code } = ctx.request.body;
    if (!phone || !password) {
      ctx.fail('请填写完整信息~');
      return;
    }
    // 按 IP 限流，防止恶意重置任意账号密码
    if (ctx.service.user.isLoginRateLimited(ctx.ip)) {
      ctx.fail('操作过于频繁，请稍后再试~');
      return;
    }
    // 图形验证码服务端校验（一次性），未通过验证码不允许重置
    if (!ctx.verifyCaptcha(code)) {
      ctx.fail('验证码错误或已过期，请重新获取');
      return;
    }
    const pwd = String(password);
    if (pwd.length < 6 || pwd.length > 16) {
      ctx.fail('密码长度需在6-16位之间~');
      return;
    }
    const result = await ctx.service.user.resetPassword({ phone, password: pwd });
    if (result) {
      ctx.success(null, '密码重置成功，请重新登录~');
    } else {
      ctx.fail('该手机号未注册~');
    }
  }
  // 注册
  public async register() {
    const { ctx } = this;
    const { username, email, password, phone, sex, code } = ctx.request.body;
    // 图形验证码服务端校验（一次性），防止脚本批量灌号
    if (!ctx.verifyCaptcha(code)) {
      ctx.fail('验证码错误或已过期，请重新获取');
      return;
    }
    const check = await ctx.service.sensitiveWord.check(username);
    if (check.blocked) {
      ctx.fail('用户名包含违禁词，请更换~');
      return;
    }
    const userInfoPhone = await ctx.service.user.getUserInfo({
      phone,
    });
    const userInfoUserName = await ctx.service.user.getUserInfo({
      username,
    });
    // 默认头像：用 DiceBear 卡通头像，随机 seed 保证每个新用户头像不同
    const randomSeed = Math.random().toString(36).slice(2, 10);
    const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`;

    if (!email || !password) {
      ctx.fail('账号密码不能为空');
      return;
    }
    const pwd = String(password);
    if (pwd.length < 6 || pwd.length > 16) {
      ctx.fail('密码长度需在6-16位之间~');
      return;
    }
    if (userInfoPhone) {
      ctx.fail('该手机号已被注册，请重新输入');
      return;
    }
    if (userInfoUserName) {
      ctx.fail('该用户名已被注册，请重新输入');
      return;
    }
    const result = await ctx.service.user.register({
      username,
      password,
      sex,
      email,
      phone,
      ctime: getNowFormatDate(),
      last_login_time: getNowFormatDate(),
      avatar: defaultAvatar,
      personalIntroduction: '',
    });
    if (result) {
      ctx.success(null, '注册成功');
    } else {
      ctx.fail('服务出错啦');
    }
  }
  // 验证码（答案 md5 只存服务端 session，不下发前端比对）
  public async captcha() {
    const { ctx } = this;
    const data = await ctx.service.user.captcha(ctx.request.body);
    if (typeof data === 'string') {
      ctx.fail(data);
      return;
    }
    if (data?.data) {
      // 把验证码答案 md5 存入 session，由服务端统一校验
      ctx.session.captcha = data.text;
      ctx.success({ data: data.data });
    } else {
      ctx.fail('验证码生成失败');
    }
  }
  // 获取用户信息
  public async getUserInfo() {
    const { ctx } = this;
    // 从 session 取当前登录用户 ID，不信任前端传入的身份
    const result = await ctx.service.user.getUserInfo({
      userId: ctx.currentUserId(),
    });
    if (result) {
      // 去除密码（保留本人手机号）
      const returnData = removePassword(result);
      ctx.success(returnData, '请求成功');
    } else {
      ctx.fail('获取用户信息失败');
    }
  }
  // 编辑信息
  public async updateUserInfo() {
    const { ctx } = this;
    const body = ctx.request.body || {};
    // 字段白名单：仅允许修改这些字段，防止 mass assignment 篡改 is_deleted/phone/password 等
    const allowedFields = [
      'username',
      'phone',
      'avatar',
      'personalIntroduction',
      'sex',
      'email',
      'daily_goal',
    ];
    const updateData: any = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updateData[key] = body[key];
      }
    }
    const check = await ctx.service.sensitiveWord.check(
      [ updateData.username, updateData.personalIntroduction ].filter(Boolean).join(' '),
    );
    if (check.blocked) {
      ctx.fail('用户名或简介包含违禁词，请修改后重试~');
      return;
    }
    // 从 session 取当前登录用户 ID，只允许修改自己的信息
    const result = await ctx.service.user.updateUserInfo({
      ...updateData,
      userId: ctx.currentUserId(),
    });
    if (!result) {
      ctx.fail('修改失败');
      return;
    }
    if (result.duplicate) {
      ctx.fail('用户名已存在，请更换~');
      return;
    }
    ctx.success(null, '修改成功');
  }
  // 获取用户上传的题目
  public async getUserUploadQues() {
    const { ctx } = this;
    // 从 session 取当前登录用户 ID，忽略前端传入的 userId
    const result = await ctx.service.user.getUserUploadQues({
      ...ctx.request.body,
      userId: ctx.currentUserId(),
    });
    if (result) {
      ctx.success(result, '请求成功');
    } else {
      ctx.fail('请求失败');
    }
  }

  // AI 学习报告：聚合用户学习数据生成个人画像（带缓存，可手动刷新）
  public async aiLearningReport() {
    const { ctx } = this;
    const userId = ctx.currentUserId();
    if (!userId) {
      ctx.fail('请先登录~');
      return;
    }
    if (!ctx.service.ai.isConfigured()) {
      ctx.success({ available: false, message: 'AI 未配置' }, '请求成功');
      return;
    }
    if (ctx.service.ai.isRateLimited(userId)) {
      ctx.success(
        { available: false, message: 'AI 请求过于频繁，请稍后再试' },
        '请求成功',
      );
      return;
    }
    // 缓存命中不扣额度
    const cachedLearn: any = await ctx.app.mysql.get('ai_learning_report', { user_id: userId });
    if (cachedLearn?.report) {
      try {
        const cached = JSON.parse(cachedLearn.report);
        ctx.success({ available: true, ...cached, fromCache: true }, 'AI 学习报告（缓存）');
        return;
      } catch { /* 缓存损坏继续生成 */ }
    }
    // 额度检查
    const hasCreditL = await ctx.service.ai.consumeCredit(userId, 1);
    if (!hasCreditL) {
      ctx.success(
        { available: false, message: 'AI 额度不足，可用积分兑换' },
        '请求成功',
      );
      return;
    }
    const result = await ctx.service.ai.analyzeLearningReport(userId);
    if (result) {
      ctx.success({ available: true, ...result }, 'AI 学习报告生成完成');
    } else {
      ctx.success(
        { available: false, message: 'AI 分析失败，请稍后重试' },
        '请求成功',
      );
    }
  }

  // 积分兑换 AI 额度（10积分=1次）
  public async exchangeAiCredit() {
    const { ctx } = this;
    const userId = ctx.currentUserId();
    const { count } = ctx.request.body;
    const num = Math.max(1, Math.min(100, Number(count) || 1));
    const cost = num * 10; // 每次10积分
    const user: any = await ctx.app.mysql.get('user', { userId });
    if (!user) {
      ctx.fail('用户不存在~');
      return;
    }
    // 积分已落库，直接扣减
    const available = Number(user.integral ?? 0);
    if (available < cost) {
      ctx.fail(`积分不足（当前${available}分），兑换${num}次需要${cost}积分`);
      return;
    }
    await ctx.app.mysql.update('user',
      {
        integral: available - cost,
        ai_credit: Number(user.ai_credit ?? 0) + num,
        credit_exchanged: Number(user.credit_exchanged ?? 0) + cost,
      },
      { where: { userId } },
    );
    ctx.success({ cost, gained: num, remaining: available - cost, credit: Number(user.ai_credit ?? 0) + num }, `兑换成功，消耗${cost}积分，获得${num}次AI额度`);
  }
}
