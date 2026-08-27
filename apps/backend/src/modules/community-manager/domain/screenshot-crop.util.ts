import sharp from '@/shared/media/sharp.util';

/** Cover resize con foco en área de interés (dashboards densos) o entropía como fallback. */
export async function resizeScreenshotCover(
  buffer: Buffer,
  width: number,
  height: number,
): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .resize(width, height, { fit: 'cover', position: sharp.strategy.attention })
      .png()
      .toBuffer();
  } catch {
    try {
      return await sharp(buffer)
        .resize(width, height, { fit: 'cover', position: 'entropy' })
        .png()
        .toBuffer();
    } catch {
      return sharp(buffer)
        .resize(width, height, { fit: 'cover', position: 'top' })
        .png()
        .toBuffer();
    }
  }
}
