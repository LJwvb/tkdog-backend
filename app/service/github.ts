import { Service } from 'egg';
import * as https from 'https';
import fs from 'fs';
import path from 'path';
import { getNowFormatDate } from '../utils';
import bcrypt from 'bcryptjs';
// 日志脱敏：替换 access_token / client_secret 等敏感字段值，避免明文入日志
function maskSensitive(text: string): string {
  return String(text).replace(
    /("?(?:access_token|client_secret)"?\s*[:=]\s*"?)([^",}\s]{4,})/gi,
    '$1***',
  );
}


/**
 * GitHub OAuth 登录服务
 */
export default class Github extends Service {
  /**
   * 生成 GitHub 授权页 URL
   */
  public getAuthUrl(state: string): string {
    const { config } = this;
    const cfg = (config as any).githubOAuth;
    const params = new URLSearchParams({
      client_id: cfg.clientId,
      redirect_uri: cfg.redirectUri,
      scope: 'read:user user:email',
      state,
      allow_signup: 'true',
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  /**
   * 用 code 换 access_token
   */
  public async getAccessToken(code: string): Promise<string | null> {
    const { config } = this;
    const cfg = (config as any).githubOAuth;
    const postData = JSON.stringify({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      code,
      redirect_uri: cfg.redirectUri,
    });

    return new Promise(resolve => {
      const req = https.request(
        {
          hostname: 'github.com',
          path: '/login/oauth/access_token',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'Content-Length': Buffer.byteLength(postData),
          },
          timeout: 15000,
        },
        res => {
          let body = '';
          res.on('data', chunk => { body += chunk; });
          res.on('end', () => {
            this.ctx.logger.info('[GitHub getAccessToken] HTTP status:', res.statusCode, 'body:', maskSensitive(body));
            try {
              const data = JSON.parse(body);
              if (data.access_token) {
                resolve(data.access_token);
              } else {
                this.ctx.logger.error('[GitHub getAccessToken] 响应中无 access_token:', maskSensitive(JSON.stringify(data)));
                resolve(null);
              }
            } catch (e) {
              this.ctx.logger.error('[GitHub getAccessToken] JSON 解析失败:', e, 'body:', maskSensitive(body));
              resolve(null);
            }
          });
        },
      );
      req.on('error', e => {
        this.ctx.logger.error('[GitHub getAccessToken] 请求错误:', e);
        resolve(null);
      });
      req.on('timeout', () => {
        this.ctx.logger.error('[GitHub getAccessToken] 请求超时');
        (req as any).destroy();
        resolve(null);
      });
      req.write(postData);
      req.end();
    });
  }

  /**
   * 用 access_token 拉 GitHub 用户信息
   */
  public async getUserInfo(accessToken: string): Promise<any | null> {
    return new Promise(resolve => {
      const req = https.get(
        {
          hostname: 'api.github.com',
          path: '/user',
          headers: {
            Authorization: `token ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'tkdog-oauth',
          },
          timeout: 15000,
        },
        res => {
          let body = '';
          res.on('data', chunk => { body += chunk; });
          res.on('end', () => {
            this.ctx.logger.info('[GitHub getUserInfo] HTTP status:', res.statusCode);
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              this.ctx.logger.error('[GitHub getUserInfo] JSON 解析失败:', e, 'body:', maskSensitive(body));
              resolve(null);
            }
          });
        },
      );
      req.on('error', e => {
        this.ctx.logger.error('[GitHub getUserInfo] 请求错误:', e);
        resolve(null);
      });
      req.on('timeout', () => {
        this.ctx.logger.error('[GitHub getUserInfo] 请求超时');
        (req as any).destroy();
        resolve(null);
      });
    });
  }

  /**
   * 把 GitHub 头像下载转存到本站静态目录，返回站内相对路径。
   * 原因：avatars.githubusercontent.com 国内访问不稳定（无代理访客头像裂图），
   * 转存到 app/public/uploads 后由本站 Nginx 直接提供。
   * 下载失败时降级返回原 URL，不阻塞登录流程。
   */
  public async mirrorAvatar(avatarUrl: string, githubId: string): Promise<string> {
    if (!avatarUrl) return '';
    const download = (urlStr: string): Promise<Buffer | null> =>
      new Promise(resolve => {
        try {
          const u = new URL(urlStr);
          // SSRF 防护：hostname 必须在白名单内（GitHub/Gravatar 官方头像域）
          const allowed = [ 'avatars.githubusercontent.com', 'gravatar.com' ];
          const isGravatarSub = u.hostname.endsWith('.gravatar.com');
          if (!allowed.includes(u.hostname) && !isGravatarSub) {
            this.ctx.logger.warn('[GitHub mirrorAvatar] 非白名单域名，拒绝下载:', u.hostname);
            resolve(null);
            return;
          }
          const req = https.get(
            {
              hostname: u.hostname,
              path: u.pathname + u.search,
              headers: { 'User-Agent': 'tkdog-oauth' },
              timeout: 15000,
            },
            res => {
              // 不跟随 redirect（避免被重定向到内网或被 MITM）
              if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400) {
                res.resume();
                this.ctx.logger.warn('[GitHub mirrorAvatar] 拒绝 3xx redirect:', res.headers.location);
                resolve(null);
                return;
              }
              if (res.statusCode !== 200) { res.resume(); resolve(null); return; }
              const chunks: Buffer[] = [];
              res.on('data', c => chunks.push(c as Buffer));
              res.on('end', () => resolve(Buffer.concat(chunks)));
            },
          );
          req.on('error', e => {
            this.ctx.logger.error('[GitHub mirrorAvatar] 下载错误:', e);
            resolve(null);
          });
          req.on('timeout', () => {
            this.ctx.logger.error('[GitHub mirrorAvatar] 下载超时');
            (req as any).destroy();
            resolve(null);
          });
        } catch (e) {
          this.ctx.logger.error('[GitHub mirrorAvatar] URL 解析失败:', e);
          resolve(null);
        }
      });

    const buf = await download(avatarUrl);
    // 空/超大（>5MB）直接降级用原 URL
    if (!buf || buf.length === 0 || buf.length > 5 * 1024 * 1024) {
      this.ctx.logger.warn('[GitHub mirrorAvatar] 下载失败或超限，降级使用原 URL:', avatarUrl);
      return avatarUrl;
    }
    try {
      const dir = path.join(this.app.baseDir, 'app/public/uploads');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
      // GitHub 头像多为 JPEG，按 magic bytes 定扩展名
      const isPng = buf[0] === 0x89 && buf[1] === 0x50;
      const isGif = buf.toString('ascii', 0, 3) === 'GIF';
      const ext = isPng ? '.png' : isGif ? '.gif' : '.jpg';
      const filename = `gh_${githubId}_${Date.now()}${ext}`;
      fs.writeFileSync(path.join(dir, filename), buf);
      this.ctx.logger.info('[GitHub mirrorAvatar] 头像已转存:', filename, `(${buf.length} bytes)`);
      return `/public/uploads/${filename}`;
    } catch (e) {
      this.ctx.logger.error('[GitHub mirrorAvatar] 写文件失败，降级使用原 URL:', e);
      return avatarUrl;
    }
  }

  /**
   * 根据 GitHub 用户信息查/建账号，返回本地用户
   */
  public async loginOrRegister(githubUser: any): Promise<any | null> {
    const { app } = this;
    const githubId = String(githubUser.id);
    const username = githubUser.login || `github_${githubId}`;
    // 头像转存到本站（失败降级用 GitHub 原始 URL）
    const avatar = await this.mirrorAvatar(githubUser.avatar_url || '', githubId);
    const email = githubUser.email || '';

    try {
      // 1. 按 github_id 查用户（不过滤软删除：否则已删用户再登录会走到 INSERT，撞 uk_github_id 唯一键）
      let user: any = await app.mysql.get('user', { github_id: githubId });

      if (user && user.is_deleted === 1) {
        // 账号已被管理端删除（软删除=可恢复的禁用态）：拒绝登录，由 controller 给明确提示
        return { deleted: true };
      }
      if (user) {
        // 已有账号，更新头像和最后登录时间
        await app.mysql.update(
          'user',
          { avatar, last_login_time: getNowFormatDate() },
          { where: { userId: user.userId } },
        );
        user.avatar = avatar;
        return user;
      }

      // 2. 如果 GitHub 账号有邮箱，尝试按邮箱匹配已有账号
      if (email) {
        user = await app.mysql.get('user', { email });
        if (user && user.is_deleted === 1) {
          // 邮箱对应的账号已被删除：同样拒绝激活
          return { deleted: true };
        }
        if (user) {
          // 绑定 github_id 到已有账号
          await app.mysql.update(
            'user',
            { github_id: githubId, avatar, last_login_time: getNowFormatDate() },
            { where: { userId: user.userId } },
          );
          user.github_id = githubId;
          user.avatar = avatar;
          return user;
        }
      }

      // 3. 新建账号（GitHub 登录用户没有密码，随机生成一个，后续可在个人中心修改）
      const randomPassword = Math.random().toString(36).slice(-8) + Date.now().toString(36);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      // 处理用户名重复
      let finalUsername = username;
      let exists = await app.mysql.get('user', { username: finalUsername });
      let suffix = 1;
      while (exists) {
        finalUsername = `${username}_${suffix}`;
        exists = await app.mysql.get('user', { username: finalUsername });
        suffix++;
      }

      const now = getNowFormatDate();
      const result = await app.mysql.insert('user', {
        username: finalUsername,
        password: hashedPassword,
        phone: null, // GitHub 登录用户手机号为空，后续可绑定
        email,
        avatar,
        github_id: githubId,
        sex: null,
        ctime: now,
        last_login_time: now,
        personalIntroduction: githubUser.bio || '',
        daily_goal: 0,
        is_deleted: 0,
        ai_credit: 100, // 初始 AI 额度
        credit_exchanged: 0,
        integral: 0,
        last_checkin_date: null,
        consecutive_days: 0,
        total_checkin: 0,
      });

      if ((result as any).affectedRows > 0) {
        return await app.mysql.get('user', { userId: (result as any).insertId });
      }
      return null;
    } catch (err) {
      this.ctx.logger.error('[GitHub OAuth] loginOrRegister error:', err);
      // 兜底：INSERT 撞 uk_github_id（并发注册或历史脏数据）→ 再查一次，给出准确结果而非模糊异常
      if ((err as any)?.code === 'ER_DUP_ENTRY') {
        const dup: any = await app.mysql.get('user', { github_id: githubId });
        if (dup) {
          return dup.is_deleted === 1 ? { deleted: true } : dup;
        }
      }
      return null;
    }
  }
}
