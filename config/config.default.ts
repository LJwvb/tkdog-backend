import { Context, EggAppConfig, EggAppInfo, PowerPartial } from 'egg';
import { randomBytes } from 'crypto';

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Egg config 导出函数签名要求保留 appInfo 形参
export default (_appInfo: EggAppInfo) => {
  const config = {} as PowerPartial<EggAppConfig>;

  // override config from framework / plugin
  // use for cookie sign key, should change to your own and keep security
  // 签名密钥：生产环境必须通过 COOKIE_KEYS 环境变量注入；
  // 未设置时每次启动生成随机密钥（重启后 session 失效，仅适合本地开发），
  // 避免硬编码弱密钥导致 ADMIN_SESS cookie 被伪造提权。
  config.keys = process.env.COOKIE_KEYS || randomBytes(32).toString('hex');

  // add your egg config in here
  config.middleware = [ 'requestLog' ];
  config.security = {
    csrf: {
      enable: false,
    },
  };
  // 上传文件大小限制（评论/头像图片等）
  config.multipart = {
    fileSize: '5mb',
  };
  config.mysql = {
    // 单数据库信息配置
    // 部署时通过环境变量注入，避免数据库密码写进会提交的源码文件；
    // 未设置时回退到本地开发默认值（127.0.0.1 / root / 空密码 / tkdog）。
    client: {
      // host
      host: process.env.DB_HOST || '127.0.0.1',
      // 端口号
      port: process.env.DB_PORT || '3306',
      // 用户名
      user: process.env.DB_USER || 'root',
      // 密码
      password: process.env.DB_PASSWORD || '',
      // 数据库名
      database: process.env.DB_NAME || 'tkdog',
      // 连接字符集：必须 utf8mb4 才能正常存取 emoji（4 字节字符），
      // node-mysql 默认是 utf8(3字节)，会导致评论表情被截断/报错。
      // egg-mysql 的 EggMySQLClientOption 类型未声明 charset，这里用交叉类型补上。
      charset: 'utf8mb4',
    } as EggMySQLClientOption & { charset?: string },
    // 是否加载到 app 上，默认开启
    app: true,
    // 是否加载到 agent 上，默认关闭
    agent: false,
  };
  // 跨域：白名单模式，不再反射任意 Origin（防止恶意站点跨站请求伪造）
  // 开发环境允许 localhost / 127.0.0.1 任意端口；生产环境通过 CORS_ORIGIN 环境变量（逗号分隔）配置
  config.cors = {
    origin: (ctx: Context) => {
      const requestOrigin = ctx.get('origin');
      if (!requestOrigin) return '';
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(requestOrigin)) {
        return requestOrigin;
      }
      const allowed = (process.env.CORS_ORIGIN || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      return allowed.includes(requestOrigin) ? requestOrigin : '';
    },
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH',
    credentials: true,
  };
  // AI 简答题判分（OpenAI 兼容 chat/completions 接口）
  // apiKey 不要提交到仓库：本地开发在 config/config.local.ts（已 gitignore）里配置，
  // 生产环境通过环境变量 AI_API_KEY 注入。
  config.aiJudge = {
    apiKey: process.env.AI_API_KEY || '',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-v4-flash',
    timeout: 60000, // 大模型响应较慢，放宽超时
    maxTokens: 2048, // V4 推理模型会先消耗 reasoning_tokens，预算太小会返回空内容
    passScore: 60, // >= 该分数判定为「答对」
    // 限流：同一用户在该时间窗口内最多触发 max 次 AI 判分（内存滑动窗口，单进程有效）
    rateLimit: {
      windowMs: 60000, // 1 分钟
      max: 30, // 每用户每分钟最多 30 次
    },
  };

  // GitHub OAuth 第三方登录
  // 本地开发在 config/config.local.ts（已 gitignore）配置；
  // 生产环境通过环境变量注入（config.local.ts 不参与生产构建）。
  // 未配置时前端不显示 GitHub 登录按钮，不影响账号密码登录。
  config.githubOAuth = {
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    redirectUri: process.env.GITHUB_REDIRECT_URI || 'http://localhost:5173',
  } as any;

  // the return config will combines to EggAppConfig
  return {
    ...config,
  };
};
