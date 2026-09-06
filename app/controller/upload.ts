import { Controller } from 'egg';
import fs from 'fs';
import path from 'path';

// 校验图片文件头（magic bytes），防止伪装扩展名的非图片内容上传
function isImageFile(header: Buffer, ext: string): boolean {
  // JPEG: FF D8 FF
  if (ext === '.jpg' || ext === '.jpeg') {
    return (
      header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff
    );
  }
  // PNG: 89 50 4E 47
  if (ext === '.png') {
    return (
      header[0] === 0x89 &&
      header[1] === 0x50 &&
      header[2] === 0x4e &&
      header[3] === 0x47
    );
  }
  // GIF: 47 49 46 38 ("GIF8")
  if (ext === '.gif') {
    return (
      header[0] === 0x47 &&
      header[1] === 0x49 &&
      header[2] === 0x46 &&
      header[3] === 0x38
    );
  }
  // WebP: "RIFF" .... "WEBP"
  if (ext === '.webp') {
    return (
      header.toString('ascii', 0, 4) === 'RIFF' &&
      header.toString('ascii', 8, 12) === 'WEBP'
    );
  }
  return false;
}

export default class upload extends Controller {
  // 图片上传（multipart，保存到 app/public/uploads）
  public async uploadImage() {
    const { ctx } = this;
    try {
      const stream = await ctx.getFileStream();
      // 单文件大小限制：5MB，与前端 EditUserInfo/评论上传提示一致。
      // 这里仅读取 Content-Length 头进行预检，真实写入前由 stream.on('data') 再做一次累加防御。
      const MAX_SIZE = 5 * 1024 * 1024;
      const declared = Number((stream as any).headers?.['content-length']) || 0;
      if (declared > MAX_SIZE) {
        ctx.fail('文件过大，最多 5MB~');
        return;
      }
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
      // auth 中间件已保证登录；这里仅做防御性兜底
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
      // 校验文件真实格式（magic bytes），防止伪装扩展名的非图片内容上传
      const header = fs.readFileSync(target).slice(0, 12);
      if (!isImageFile(header, ext)) {
        try {
          fs.unlinkSync(target);
        } catch {
          // 忽略删除失败
        }
        ctx.fail('文件内容与图片格式不符~');
        return;
      }
      ctx.success({ url: `/public/uploads/${filename}` }, '上传成功');
    } catch (err) {
      ctx.fail('上传失败~');
    }
  }
}
