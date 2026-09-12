# 面试狗 · 后端服务（tkdog-backend）

> 在线面试刷题平台后端服务，为前端 `tkdog` 提供 RESTful API。
> 涵盖题库、试卷、答题判分、用户互动、AI 简答判分与管理后台等完整业务闭环。

## ✨ 功能特性

- **用户系统**：注册 / 登录 / 重置密码（图形验证码 + bcrypt 加密）、**GitHub 第三方登录（OAuth 2.0）**、个人信息编辑（用户名/手机号，用户名唯一性校验）、每日刷题目标、积分体系、**违规账号删除管控（登录时提示因违规被删除）**
- **题库系统**：单选 / 多选 / 判断 / 简答四类题型，题目浏览、关键词搜索、相似题推荐、每日一题、随机刷题
- **AI 能力矩阵**：
  - **AI 解题提示**：独立 hint 字段存储，只给解题思路不给答案，缓存命中不扣额度
  - **AI 简答判分**：DeepSeek 大模型自动判分（OpenAI 兼容接口，带限流与超时保护）
  - **AI 智能组卷**：根据条件自动生成试卷
  - **AI 答题报告**：能力画像、知识点掌握度分析
  - **AI 内容审核**：评论 / 反馈三级审核（敏感词拦截 → AI 明显违规拒绝 → AI 疑似违规待审核），内容缓存 1 小时防刷 token
  - **AI 额度系统**：每人初始 100 次额度，支持积分兑换额度，调用前额度检查，token 消耗日志
- **试卷系统**：自主组卷 / AI 智能组卷、试卷公开/私有权限、试卷审核、答题与答题记录、答题报告回看
- **互动体系**：题目点赞 / 收藏 / 评论（敏感词 + AI 智能审核）、关注用户、每日打卡、排行榜（总榜/周榜/月榜）、公告、意见反馈（AI 审核）、站内通知
- **管理后台**：题目 / 试卷审核、标签管理、用户管理（管理员/用户分 Tab）、评论管理、纠错反馈管理、违禁词管理、删除与恢复、数据统计（近七日趋势、科目 / 题型分布）
- **性能与安全**：用户级 AI 限流（每分钟 30 次）、内容缓存防重复调用、防暴力破解（IP 限流）、bcrypt 密码加密、**JWT 双 Token 鉴权（accessToken 24h + refreshToken 7d，401 无感刷新）**、**Token 版本号机制（账号删除/修改密码后旧 Token 立即失效，内存缓存 1 分钟减少 DB 查询）**

## 🛠 技术栈

| 类别 | 技术 |
|---|---|
| 运行时 | Node.js ≥ 14 |
| 框架 | Egg.js 2.x + TypeScript |
| 数据库 | MariaDB 10.11（utf8mb4，兼容 MySQL 8.0） |
| 认证 | bcryptjs（密码）、**JWT 双 Token（jsonwebtoken）+ Token 版本号机制**、GitHub OAuth 2.0 |
| 其他 | svg-captcha（图形验证码）、egg-cors（跨域）、string-similarity（相似题）、DeepSeek API（AI 判分/解题提示/智能组卷/内容审核） |

## 📁 目录结构

```
app/
  controller/   接口控制器（user / questions / paper / admin / comment ...）
  service/      业务逻辑层
  middleware/   鉴权中间件（auth / adminAuth / authOrAdmin）
  extend/       ctx 扩展（统一响应、验证码校验、管理员解析）
  utils/        工具函数（日期、科目名等）
  public/       静态资源（上传的图片等）
  router.ts     路由表（统一 /api 前缀）
config/
  config.default.ts   公共配置（数据库、跨域、AI 判分、Cookie 密钥）
  config.local.ts     本地开发配置（敏感密钥，已 gitignore 不提交）
  config.prod.ts      生产配置
  plugin.ts           Egg 插件
tkdog.sql       建表脚本 + 初始数据（含管理员与演示账号）
```

## 🚀 快速开始

### 环境要求

- Node.js ≥ 14
- MySQL 8.0（数据库名 `tkdog`，字符集 `utf8mb4`）

### 1. 安装依赖

```bash
npm install
```

### 2. 准备数据库

创建数据库 `tkdog`（字符集 utf8mb4），并导入建表脚本：

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS tkdog DEFAULT CHARACTER SET utf8mb4;"
mysql -u root -p tkdog < tkdog.sql
```

### 3. 配置本地开发密钥

本地开发密钥写在 `config/config.local.ts`（该文件已被 `.gitignore` 忽略，不会提交到仓库）：

```ts
export default () => {
  const config: any = {};
  // AI 判分密钥（DeepSeek，OpenAI 兼容接口）
  config.aiJudge = { apiKey: '你的 DeepSeek API Key' };
  // Cookie 签名密钥（生产环境务必替换为随机长字符串）
  config.keys = '你的随机密钥';
  // GitHub OAuth 第三方登录（可选，不配置则不显示 GitHub 登录按钮）
  config.githubOAuth = {
    clientId: '你的 GitHub OAuth App Client ID',
    clientSecret: '你的 GitHub OAuth App Client Secret',
    redirectUri: 'http://localhost:5173', // 必须与 GitHub OAuth App 配置完全一致
  };
  return config;
};
```

> 若不需要 AI 简答判分，可跳过 `aiJudge` 配置，不影响其他功能。

### 4. 启动开发服务

```bash
npm run dev
```

服务默认运行在 `http://127.0.0.1:7001`。

> 前端项目见同级目录 `tkdog`，已通过 Vite 代理将 `/api`、`/public` 转发到本服务，前后端同源开发。

## ⚙️ 配置说明

| 配置项 | 位置 | 说明 |
|---|---|---|
| 数据库连接 | `config/config.default.ts` → `config.mysql` | 默认 `root@127.0.0.1:3306/tkdog`，按需修改 |
| Cookie 签名密钥 | `config.keys` | 本地在 `config.local.ts` 配置；生产用环境变量 `COOKIE_KEYS` 注入 |
| AI 服务 | `config.aiJudge` | 本地在 `config.local.ts` 配置 `apiKey`/`baseUrl`/`model`；用于 AI 判分、解题提示、智能组卷、内容审核；生产用环境变量 `AI_API_KEY` 注入 |
| AI 额度 | 初始 100 次/人 | 支持积分兑换额度，调用前检查，缓存命中不扣 |
| GitHub OAuth | `config.githubOAuth` | 本地在 `config.local.ts` 配置 `clientId`/`clientSecret`/`redirectUri`；用于 GitHub 第三方登录 |
| JWT 鉴权 | `app/utils/jwt.ts`（生产必须用环境变量 `JWT_SECRET` 注入） | accessToken 24h + refreshToken 7d，401 无感刷新，Token 版本号机制使旧 Token 可主动失效 |
| 跨域 | `config.cors` | 反射请求 Origin 并允许携带凭证，配合前端 `withCredentials` |

> 安全提醒：`config.local.ts` 与 `.env*` 均已被 `.gitignore` 忽略，密钥严禁写入 `config.default.ts` 等会提交的源码文件。

## 🔌 接口概览

接口统一以 `/api` 为前缀，按访问权限分为三类：

- **公开接口**：图形验证码、注册、登录、题目浏览 / 搜索、试卷浏览、评论列表、排行榜、公告等
- **登录接口**（`auth`）：个人信息、上传题目、随机刷题、点赞 / 收藏 / 评论、组卷、打卡、关注、反馈等
- **管理员接口**（`adminAuth`）：题目 / 试卷审核、标签管理、用户管理、数据统计等
