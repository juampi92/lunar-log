export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.85;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Draw the cropped region of `image` (at natural resolution) onto a canvas,
 * optionally downscaling so the longest side is at most `maxDimension`, then
 * return a JPEG Blob.
 */
export async function getCroppedBlob(
  image: HTMLImageElement,
  crop: CropArea,
  rotation = 0,
  maxDimension = MAX_DIMENSION,
  quality = JPEG_QUALITY
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  const safeArea = Math.max(image.width, image.height) * 2;

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);
  ctx.drawImage(image, safeArea / 2 - image.width * 0.5, safeArea / 2 - image.height * 0.5);

  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  // Output canvas at the cropped region's natural size.
  let outW = Math.round(crop.width);
  let outH = Math.round(crop.height);
  const scale = Math.min(1, maxDimension / Math.max(outW, outH));
  outW = Math.round(outW * scale);
  outH = Math.round(outH * scale);

  const out = document.createElement('canvas');
  out.width = outW;
  out.height = outH;
  const outCtx = out.getContext('2d');
  if (!outCtx) throw new Error('Canvas 2D context unavailable');

  outCtx.putImageData(
    data,
    Math.round(safeArea / 2 - image.width * 0.5 - crop.x),
    Math.round(safeArea / 2 - image.height * 0.5 - crop.y)
  );

  // Downscale to final size if needed.
  if (out.width !== outW || out.height !== outH) {
    out.width = outW;
    out.height = outH;
  }

  return new Promise<Blob>((resolve, reject) => {
    out.toBlob(
      blob => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to encode cropped image'));
      },
      'image/jpeg',
      quality
    );
  });
}

export function fileToImageUrl(file: File): string {
  return URL.createObjectURL(file);
}

export async function fileToImage(file: File): Promise<HTMLImageElement> {
  return loadImage(fileToImageUrl(file));
}
