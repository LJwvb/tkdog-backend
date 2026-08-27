// 配置统一返回格式 + 鉴权辅助方法

import { Context } from 'egg';
import md5 from 'md5';

export default {
  success(this: Context, data: any, message = '请求成功', code = 200) {
    this.body = {
      data,
      message,
      success: true,
      code,
    };
  },
  fail(this: Context, message = '请求失败', code = 500) {
    this.body = {
      message,
      success: false,
      code,
    };
  },
  // 当前登录用户 ID（从 session 取，未登录返回 undefined）
  currentUserId(this: Context): number | undefined {
    return this.session?.userId;
  },
  // 当前登录用户名
  currentUsername(this: Context): string | undefined {
    return this.session?.username;
  },
  // 解析独立管理员 cookie（ADMIN_SESS）
  parseAdminCookie(this: Context): { id?: number; name?: string } | null {
    const raw = this.cookies.get('ADMIN_SESS', { signed: true });
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  // 当前管理员 ID（独立 ADMIN_SESS cookie，与普通用户 session 完全隔离）
  currentAdminId(this: Context): number | undefined {
    return this.parseAdminCookie()?.id;
  },
  // 当前管理员名
  currentAdminName(this: Context): string | undefined {
    return this.parseAdminCookie()?.name;
  },
  // 是否管理员（存在 ADMIN_SESS cookie 即视为管理员）
  isAdmin(this: Context): boolean {
    return Boolean(this.cookies.get('ADMIN_SESS', { signed: true }));
  },
  // 服务端校验图形验证码（一次性：校验后立即清除，防止重放）
  // 验证码生成时只把 text 的 md5 存入 session，前端提交明文 code 在此比对
  verifyCaptcha(this: Context, code?: string): boolean {
    const expected = this.session?.captcha;
    // 一次性使用，无论对错都清除，避免被重复试探
    this.session!.captcha = null;
    if (!expected || !code) return false;
    return md5(String(code).trim().toLowerCase()) === expected;
  },
  // 未登录/无权限统一响应
  unauthorized(this: Context, message = '未登录或登录已过期') {
    this.status = 401;
    this.body = {
      message,
      success: false,
      code: 401,
    };
  },
};
