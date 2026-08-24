import { Controller } from 'egg';
import fs from 'fs';
import path from 'path';

export default class upload extends Controller {
  // 图片上传（multipart，保存到 app/public/uploads）
  public async uploadImage() {
    const { ctx } = this;
    try {
      const stream = await ctx.getFileStream();
      const ext = path.extname(stream.filename || '').toLowerCase() || '.png';
      if (![ '.jpg', '.jpeg', '.png', '.gif', '.webp' ].includes(ext)) {
        ctx.fail('仅支持图片格式~');
        return;
      }
      // 上传渠道（comment/avatar/...），只保留安全字符，防止注入特殊字符
      const channel =
        String(ctx.request.body?.channel || 'common')
          .replace(/[^a-zA-Z0-9_-]/g, '')
          .slice(0, 20) || 'common';
      // 上传用户（未登录默认 0）
      const userId = ctx.currentUserId() || 0;
      // 文件名：用户id_时间戳_渠道_随机码.扩展名（随机码避免同毫秒重复覆盖）
      const filename = `${userId}_${Date.now()}_${channel}_${Math.random()
        .toString(36)
        .slice(2, 8)}${ext}`;
      const dir = path.join(this.app.baseDir, 'app/public/uploads');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
      const target = path.join(dir, filename);
      const ws = fs.createWriteStream(target);
      stream.pipe(ws);
      await new Promise((resolve, reject) => {
        ws.on('finish', resolve);
        ws.on('error', reject);
      });
      // 超过 multipart.fileSize（5MB）时 egg 会截断，这里删除半截文件并拒绝
      if ((stream as any).truncated) {
        try {
          fs.unlinkSync(target);
        } catch {
          // 忽略删除失败
        }
        ctx.fail('图片大小不能超过 5MB~');
        return;
      }
      ctx.success({ url: `/public/uploads/${filename}` }, '上传成功');
    } catch (err) {
      ctx.fail('上传失败~');
    }
  }
}
