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
 * Crop `image` to `crop` (in natural pixels) and return a JPEG Blob, optionally
 * downscaled so the longest side is at most `maxDimension`.
 *
 * Coordinates follow react-easy-crop's `croppedAreaPixels` convention:
 * `crop.x` / `crop.y` are the top-left of the crop within the source image,
 * measured in the image's natural pixels.
 *
 * Uses `naturalWidth` / `naturalHeight` defensively so the math is correct
 * regardless of any CSS sizing that may have been applied to the element.
 */
export async function getCroppedBlob(
  image: HTMLImageElement,
  crop: CropArea,
  rotation = 0,
  maxDimension = MAX_DIMENSION,
  quality = JPEG_QUALITY
): Promise<Blob> {
  // Use the image's natural resolution, not its rendered size on screen.
  // Rendered size is affected by CSS sizing and `devicePixelRatio`, while
  // `croppedAreaPixels` from react-easy-crop is always in natural pixels.
  const naturalW = image.naturalWidth || image.width;
  const naturalH = image.naturalHeight || image.height;

  // First, render the source image at its natural resolution into a "full"
  // canvas. This lets us handle rotation cleanly when it's wired through
  // and gives the next step a single, well-defined source rectangle.
  const swap = rotation === 90 || rotation === 270;
  const fullW = swap ? naturalH : naturalW;
  const fullH = swap ? naturalW : naturalH;

  const full = document.createElement('canvas');
  full.width = fullW;
  full.height = fullH;
  const fullCtx = full.getContext('2d');
  if (!fullCtx) throw new Error('Canvas 2D context unavailable');

  if (rotation !== 0) {
    fullCtx.translate(fullW / 2, fullH / 2);
    fullCtx.rotate((rotation * Math.PI) / 180);
    fullCtx.drawImage(image, -naturalW / 2, -naturalH / 2);
  } else {
    fullCtx.drawImage(image, 0, 0);
  }

  // Extract the crop region at 1:1 with drawImage's source/dest rect API.
  // Clamp coordinates so we never read outside the rendered image.
  const sx = Math.max(0, Math.round(crop.x));
  const sy = Math.max(0, Math.round(crop.y));
  const sw = Math.max(1, Math.min(full.width - sx, Math.round(crop.width)));
  const sh = Math.max(1, Math.min(full.height - sy, Math.round(crop.height)));

  const cropped = document.createElement('canvas');
  cropped.width = sw;
  cropped.height = sh;
  const croppedCtx = cropped.getContext('2d');
  if (!croppedCtx) throw new Error('Canvas 2D context unavailable');
  croppedCtx.drawImage(full, sx, sy, sw, sh, 0, 0, sw, sh);

  // Downscale (with proper resampling) if needed. drawImage into a smaller
  // destination canvas resamples using the canvas's smoothing settings, unlike
  // putImageData which is a strict 1:1 copy and would only show a corner of
  // the intended crop.
  const longestSide = Math.max(sw, sh);
  const scale = Math.min(1, maxDimension / longestSide);
  const outW = Math.max(1, Math.round(sw * scale));
  const outH = Math.max(1, Math.round(sh * scale));

  if (outW === sw && outH === sh) {
    return encodeJpeg(cropped, quality);
  }

  const out = document.createElement('canvas');
  out.width = outW;
  out.height = outH;
  const outCtx = out.getContext('2d');
  if (!outCtx) throw new Error('Canvas 2D context unavailable');
  outCtx.imageSmoothingEnabled = true;
  outCtx.imageSmoothingQuality = 'high';
  outCtx.drawImage(cropped, 0, 0, sw, sh, 0, 0, outW, outH);
  return encodeJpeg(out, quality);
}

function encodeJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
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
