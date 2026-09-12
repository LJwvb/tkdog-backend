import { Controller } from 'egg';
import * as crypto from 'crypto';
import { generateTokenPair } from '../utils/jwt';

/**
 * OAuth 第三方登录控制器
 */
export default class OAuth extends Controller {
  /**
   * 跳转到 GitHub 授权页
   * GET /api/oauth/github
   */
  public async github() {
    const { ctx } = this;
    ctx.logger.info('[OAuth github] 收到 GitHub 登录请求, session:', JSON.stringify(ctx.session));
    const cfg = (ctx.app.config as any).githubOAuth;

    if (!cfg || !cfg.clientId || cfg.clientId === 'YOUR_GITHUB_CLIENT_ID') {
      ctx.logger.error('[OAuth github] GitHub 登录未配置');
      ctx.fail('GitHub 登录尚未配置，请联系管理员');
      return;
    }

    // 生成 state 防 CSRF，存在 session 中
    const state = crypto.randomBytes(16).toString('hex');
    ctx.session.oauthState = state;
    ctx.logger.info('[OAuth github] 生成 state:', state);

    const authUrl = ctx.service.github.getAuthUrl(state);
    ctx.logger.info('[OAuth github] 生成授权 URL:', authUrl);
    // 返回授权 URL，前端跳转（避免 302 跨域问题）
    ctx.success({ authUrl }, '正在跳转 GitHub 授权页');
  }

  /**
   * 处理 GitHub 回调
   * POST /api/oauth/github/callback
   * body: { code, state }
   */
  public async githubCallback() {
    const { ctx } = this;
    const { code, state } = ctx.request.body;
    ctx.logger.info('[OAuth githubCallback] 收到回调请求, code:', code ? code.substring(0, 10) + '...' : 'null', 'state:', state);
    ctx.logger.info('[OAuth githubCallback] 当前 session:', JSON.stringify(ctx.session));

    if (!code) {
      ctx.logger.error('[OAuth githubCallback] 缺少 code 参数');
      ctx.fail('授权失败：缺少 code 参数');
      return;
    }

    // 校验 state（防 CSRF）
    const savedState = ctx.session.oauthState;
    ctx.logger.info('[OAuth githubCallback] savedState:', savedState, 'received state:', state);
    if (!savedState || savedState !== state) {
      ctx.logger.error('[OAuth githubCallback] state 校验不通过');
      ctx.fail('授权失败：state 校验不通过，请重试');
      return;
    }
    // 清除一次性 state
    ctx.session.oauthState = null;
    ctx.logger.info('[OAuth githubCallback] state 校验通过，已清除');

    // 1. 用 code 换 access_token
    ctx.logger.info('[OAuth githubCallback] 用 code 换 access_token...');
    const accessToken = await ctx.service.github.getAccessToken(code);
    ctx.logger.info('[OAuth githubCallback] accessToken:', accessToken ? accessToken.substring(0, 10) + '...' : 'null');
    if (!accessToken) {
      ctx.logger.error('[OAuth githubCallback] 无法获取 access_token');
      ctx.fail('GitHub 授权失败：无法获取 access_token');
      return;
    }

    // 2. 拉 GitHub 用户信息
    ctx.logger.info('[OAuth githubCallback] 拉取 GitHub 用户信息...');
    const githubUser = await ctx.service.github.getUserInfo(accessToken);
    ctx.logger.info('[OAuth githubCallback] GitHub 用户:', githubUser ? { id: githubUser.id, login: githubUser.login, email: githubUser.email } : 'null');
    if (!githubUser || !githubUser.id) {
      ctx.logger.error('[OAuth githubCallback] 无法获取用户信息');
      ctx.fail('GitHub 授权失败：无法获取用户信息');
      return;
    }

    // 3. 查/建本地账号
    ctx.logger.info('[OAuth githubCallback] 查/建本地账号...');
    const user = await ctx.service.github.loginOrRegister(githubUser);
    ctx.logger.info('[OAuth githubCallback] 本地用户:', user ? { userId: user.userId, username: user.username, phone: user.phone } : 'null');
    if (!user) {
      ctx.logger.error('[OAuth githubCallback] 账号创建或查询异常');
      ctx.fail('登录失败：账号创建或查询异常');
      return;
    }

    // 4. 生成双 Token（accessToken 24h，refreshToken 7d），携带 tokenVersion
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokenPair({
      userId: user.userId,
      username: user.username,
      tokenVersion: (user as any).token_version ?? 0,
    });
    ctx.logger.info('[OAuth githubCallback] token pair 已生成, userId:', user.userId, 'username:', user.username);

    // 5. 返回用户信息 + 双 token（去除密码）
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- 解构剔除 password，避免随响应下发
    const { password, ...userInfo } = user;
    ctx.logger.info('[OAuth githubCallback] 返回用户信息:', JSON.stringify(userInfo));
    ctx.success({ ...userInfo, token: newAccessToken, accessToken: newAccessToken, refreshToken: newRefreshToken }, 'GitHub 登录成功');
  }
}
