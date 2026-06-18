import { format } from 'date-fns';
import { EyeOff, Image, Camera, X } from 'lucide-react';
import { MoonEntry } from '../storage/types';
import { EntryThumbnail } from './EntryThumbnail';

interface DateActionsMenuProps {
  selectedDate: Date;
  entry: MoonEntry | null;
  onMarkNotSeen: () => void;
  onTakePicture: () => void;
  onPickFromGallery: () => void;
  onRemoveEntry: () => void;
}

export default function DateActionsMenu({
  selectedDate,
  entry,
  onMarkNotSeen,
  onTakePicture,
  onPickFromGallery,
  onRemoveEntry,
}: DateActionsMenuProps) {
  const formattedDate = format(selectedDate, 'MMMM d, yyyy');

  if (entry) {
    return (
      <div className="actions">
        <div className="actions__date">{formattedDate}</div>
        <div className="actions__content">
          <div className="actions__entry">
            {entry.notSeen ? (
              <>
                <EyeOff size={24} color="#fff" />
                <span className="actions__not-seen">Not seen</span>
              </>
            ) : entry.image ? (
              <EntryThumbnail imageId={entry.image} />
            ) : null}
          </div>
          <button className="actions__btn actions__btn--danger" onClick={onRemoveEntry}>
            <X size={24} color="#fff" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="actions">
      <div className="actions__date">{formattedDate}</div>
      <div className="actions__buttons">
        <button className="actions__btn" onClick={onMarkNotSeen} aria-label="Mark not seen">
          <EyeOff size={24} color="#fff" />
        </button>
        <button className="actions__btn" onClick={onPickFromGallery} aria-label="Pick from gallery">
          <Image size={24} color="#fff" />
        </button>
        <button className="actions__btn" onClick={onTakePicture} aria-label="Take picture">
          <Camera size={24} color="#fff" />
        </button>
      </div>
    </div>
  );
}
