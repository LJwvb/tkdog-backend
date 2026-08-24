import { Controller } from 'egg';
import { getNowFormatDate, removePassword } from '../utils';

export default class User extends Controller {
  // 登录
  public async login() {
    const { ctx } = this;
    const { password, phone } = ctx.request.body;
    if (!phone || !password) {
      ctx.fail('账号密码不能为空');
      return;
    }
    // 防暴力破解：按 IP 限流
    if (ctx.service.user.isLoginRateLimited(ctx.ip)) {
      ctx.fail('登录过于频繁，请稍后再试');
      return;
    }
    const data = await ctx.service.user.login({ password, phone });

    if (data) {
      // 设置 session（后端鉴权依据，前端不可篡改）。
      // 只写普通用户身份，不动管理员的 ADMIN_SESS cookie，两者可在同一浏览器并存。
      ctx.session.userId = data.userId;
      ctx.session.username = data.username;
      await ctx.service.user.updateUserInfo({
        last_login_time: getNowFormatDate(),
        userId: data.userId,
      });
      // 去除密码
      const returnData = removePassword(data);
      ctx.success(returnData, '登录成功');
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
  // 重置密码（忘记密码：按手机号直接重置）
  public async resetPassword() {
    const { ctx } = this;
    const { phone, password } = ctx.request.body;
    if (!phone || !password) {
      ctx.fail('请填写完整信息~');
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
    const { username, email, password, phone, sex } = ctx.request.body;
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
  // 验证码
  public async captcha() {
    const { ctx } = this;
    const data = await ctx.service.user.captcha(ctx.request.body);
    if (typeof data === 'string') {
      ctx.fail(data);
      return;
    }
    if (data?.data) {
      ctx.success(data);
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
      // 去除密码
      const returnData = removePassword(result);
      ctx.success(returnData, '请求成功');
    } else {
      ctx.fail('获取用户信息失败');
    }
  }
  // 编辑信息
  public async updateUserInfo() {
    const { ctx } = this;
    const body = ctx.request.body;
    const check = await ctx.service.sensitiveWord.check(
      [ body?.username, body?.personalIntroduction ].filter(Boolean).join(' '),
    );
    if (check.blocked) {
      ctx.fail('用户名或简介包含违禁词，请修改后重试~');
      return;
    }
    // 从 session 取当前登录用户 ID，只允许修改自己的信息
    const result = await ctx.service.user.updateUserInfo({
      ...body,
      userId: ctx.currentUserId(),
    });
    if (result) {
      ctx.success(null, '修改成功');
    } else {
      ctx.fail('修改失败');
    }
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
}
