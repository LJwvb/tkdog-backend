import sharp from 'sharp';

/**
 * 图片格式统一工具：本站所有上传图片统一存 webp。
 * 唯一例外是 GIF 动图（sharp 默认只取第一帧，动图会变成静帧），由调用方自行排除。
 */

/** 按文件头判定的图片真实格式 */
export type ImageFormat = 'jpeg' | 'png' | 'gif' | 'webp' | 'bmp' | null;

/** 按 magic bytes 判定图片真实格式，判定不出来返回 null */
export function detectImageFormat(buf: Buffer): ImageFormat {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'jpeg';
  }
  if (
    buf.length >= 4 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return 'png';
  }
  if (buf.length >= 4 && buf.toString('ascii', 0, 4) === 'GIF8') {
    return 'gif';
  }
  if (
    buf.length >= 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'webp';
  }
  if (buf.length >= 2 && buf[0] === 0x42 && buf[1] === 0x4d) {
    return 'bmp';
  }
  return null;
}

/**
 * 把图片 Buffer 转成 webp（不缩放，只换格式）。
 * - png 多为截图/图标，质量给高一点，避免文字边缘发虚
 * - 转码失败（损坏文件、超出 sharp 解码上限等）返回 null，由调用方决定降级策略：
 *   保留原格式落盘，绝不因此让上传/登录失败
 */
export async function toWebpBuffer(
  buf: Buffer,
  format: ImageFormat,
): Promise<Buffer | null> {
  try {
    return await sharp(buf, { animated: false })
      .webp({ quality: format === 'png' ? 92 : 82, effort: 4 })
      .toBuffer();
  } catch {
    return null;
  }
}
