import { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import type { CropArea } from '../services/crop';
import { getCroppedBlob, fileToImage } from '../services/crop';
import { Check, X } from 'lucide-react';

interface CropModalProps {
  file: File;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}

export default function CropModal({ file, onConfirm, onCancel }: CropModalProps) {
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<CropArea | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    fileToImage(file).then(setImageEl);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onCropComplete = useCallback((_: unknown, areaPixels: CropArea) => {
    setCroppedArea(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!imageEl || !croppedArea) return;
    const blob = await getCroppedBlob(imageEl, croppedArea);
    onConfirm(blob);
  };

  return (
    <div className="crop-overlay">
      <div className="crop__title">Zoom to the moon</div>
      <div className="crop__container">
        {imageUrl && (
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        )}
      </div>
      <div className="crop__controls">
        <input
          type="range"
          className="crop__slider"
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={e => setZoom(Number(e.target.value))}
        />
        <div className="crop__actions">
          <button className="crop__action-btn crop__action-btn--cancel" onClick={onCancel}>
            <X size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Cancel
          </button>
          <button className="crop__action-btn crop__action-btn--confirm" onClick={handleConfirm}>
            <Check size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
