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
      const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
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
      ctx.success({ url: `/public/uploads/${filename}` }, '上传成功');
    } catch (err) {
      ctx.fail('上传失败~');
    }
  }
}
