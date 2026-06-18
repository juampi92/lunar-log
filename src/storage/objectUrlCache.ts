import { MoonStorage } from './moonDb';

const cache = new Map<string, string>();

export async function getObjectUrl(imageId: string): Promise<string | null> {
  const cached = cache.get(imageId);
  if (cached) return cached;

  const storage = MoonStorage.getInstance();
  const blob = await storage.getImage(imageId);
  if (!blob) return null;

  const url = URL.createObjectURL(blob);
  cache.set(imageId, url);
  return url;
}

export function revokeObjectUrl(imageId: string): void {
  const url = cache.get(imageId);
  if (url) {
    URL.revokeObjectURL(url);
    cache.delete(imageId);
  }
}

export function revokeAll(): void {
  for (const url of cache.values()) {
    URL.revokeObjectURL(url);
  }
  cache.clear();
}
