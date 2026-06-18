import { useEffect, useState } from 'react';
import { getObjectUrl } from '../storage/objectUrlCache';

interface EntryThumbnailProps {
  imageId: string;
}

export function EntryThumbnail({ imageId }: EntryThumbnailProps) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getObjectUrl(imageId).then(u => {
      if (active) setUrl(u);
    });
    return () => {
      active = false;
    };
  }, [imageId]);

  if (!url) return null;
  return <img className="actions__entry-img" src={url} alt="Moon entry" />;
}
