import { Context, EggAppConfig, EggAppInfo, PowerPartial } from 'egg';

export default (appInfo: EggAppInfo) => {
  const config = {} as PowerPartial<EggAppConfig>;

  // override config from framework / plugin
  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1671019775307_7697';

  // add your egg config in here
  config.middleware = [];
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
    client: {
      // host
      host: '127.0.0.1',
      // 端口号
      port: '3306',
      // 用户名
      user: 'root',
      // 密码
      password: '',
      // 数据库名
      database: 'demo',
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
  // 跨域：反射请求 Origin 并允许携带凭证（前端 axios 开启了 withCredentials）
  config.cors = {
    origin: (ctx: Context) => ctx.get('origin'),
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

  // the return config will combines to EggAppConfig
  return {
    ...config,
  };
};
