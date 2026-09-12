import { EggAppConfig, PowerPartial } from 'egg';

// 生产环境配置（EGG_SERVER_ENV=prod 时加载）
// 本文件会被提交到仓库，禁止写入任何密钥；密钥一律通过环境变量注入。
export default () => {
  const config: PowerPartial<EggAppConfig> = {};

  // 反向代理支持：生产环境前端由 Nginx 承载，请求经代理转发到本服务。
  // 开启后 Egg 会读取 X-Forwarded-For / X-Real-IP 还原客户端真实 IP，
  // 否则 ctx.ip 恒为 Nginx 内网 IP —— 而登录防爆破限流正是基于 ctx.ip
  // （见 user.ts / admin.ts 的 isLoginRateLimited），会导致「一人触发限流、全站登录被封」。
  config.proxy = true;
  // 只信任最近一层代理写入的 IP（本项目架构为「Nginx → Node」单层代理）
  config.maxIpsCount = 1;

  // 生产环境日志：JSON 格式便于采集，级别 warn 减少磁盘占用与噪音
  config.logger = {
    level: 'WARN',
    consoleLevel: 'WARN',
    outputJSON: true,
  };

  return config;
};
