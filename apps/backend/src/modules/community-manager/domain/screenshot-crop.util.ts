import sharp from '@/shared/media/sharp.util';

export type ScreenshotResizeBackground = {
  r: number;
  g: number;
  b: number;
  alpha?: number;
};

/** Fondo del área de pantalla en mockups de dispositivo. */
export const DEVICE_SCREEN_BACKGROUND: ScreenshotResizeBackground = {
  r: 10,
  g: 10,
  b: 12,
  alpha: 255,
};

export async function readScreenshotDimensions(
  buffer: Buffer,
): Promise<{ width: number; height: number }> {
  const meta = await sharp(buffer).metadata();
  return {
    width: meta.width && meta.width > 0 ? meta.width : 1,
    height: meta.height && meta.height > 0 ? meta.height : 1,
  };
}

export function isPortraitScreenshot(width: number, height: number): boolean {
  return height > width * 1.05;
}

/** Cover resize con foco en área de interés (banners landscape). */
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

/** Contain — captura completa dentro del slot (letterbox si el aspect ratio no coincide). */
export async function resizeScreenshotContain(
  buffer: Buffer,
  width: number,
  height: number,
  background: ScreenshotResizeBackground = { r: 15, g: 23, b: 42, alpha: 255 },
): Promise<Buffer> {
  return sharp(buffer)
    .resize(width, height, {
      fit: 'contain',
      position: 'top',
      background,
    })
    .png()
    .toBuffer();
}

/**
 * Elige contain o cover según orientación de la captura vs. el slot.
 * Evita recortar capturas móvil/portrait en franjas horizontales de plantilla.
 */
export async function resizeScreenshotForSlot(
  buffer: Buffer,
  width: number,
  height: number,
  options: {
    background?: ScreenshotResizeBackground;
    forceContain?: boolean;
  } = {},
): Promise<Buffer> {
  const { width: srcW, height: srcH } = await readScreenshotDimensions(buffer);
  const slotAspect = width / height;
  const srcAspect = srcW / srcH;
  const portraitInWideSlot = isPortraitScreenshot(srcW, srcH) && slotAspect > srcAspect * 1.08;
  const useContain = options.forceContain ?? portraitInWideSlot;

  if (useContain) {
    return resizeScreenshotContain(buffer, width, height, options.background);
  }

  return resizeScreenshotCover(buffer, width, height);
}
