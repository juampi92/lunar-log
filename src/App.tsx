import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import NightSkyBackground from './components/NightSkyBackground';
import Calendar from './components/Calendar';
import DateActionsMenu from './components/DateActionsMenu';
import CropModal from './components/CropModal';
import { MoonStorage } from './storage/moonDb';
import { revokeObjectUrl } from './storage/objectUrlCache';
import { takePicture, pickFromGallery } from './services/imageService';
import { MoonEntry } from './storage/types';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw } from 'lucide-react';

export default function App() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentEntry, setCurrentEntry] = useState<MoonEntry | null>(null);
  const [entries, setEntries] = useState<Record<string, MoonEntry>>({});
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(url: string) {
      console.warn('SW registered:', url);
    },
  });

  useEffect(() => {
    const initStorage = async () => {
      const storage = MoonStorage.getInstance();
      await storage.init();
      const allEntries = await storage.getAllEntries();
      setEntries(allEntries);
    };
    initStorage();
  }, []);

  useEffect(() => {
    const loadSelectedDateEntry = async () => {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const storage = MoonStorage.getInstance();
      const entry = await storage.getEntry(dateStr);
      setCurrentEntry(entry);
    };
    loadSelectedDateEntry();
  }, [selectedDate, entries]);

  const refreshEntries = async () => {
    const storage = MoonStorage.getInstance();
    const allEntries = await storage.getAllEntries();
    setEntries(allEntries);
  };

  const startCapture = async (withCamera: boolean) => {
    const file = withCamera ? await takePicture() : await pickFromGallery();
    if (!file) return;
    setPendingFile(file);
  };

  const handleTakePicture = () => startCapture(true);
  const handlePickFromGallery = () => startCapture(false);

  const handleMarkNotSeen = async () => {
    const storage = MoonStorage.getInstance();
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    await storage.markDateAsNotSeen(dateStr);
    await refreshEntries();
  };

  const handleCropConfirm = async (blob: Blob) => {
    setPendingFile(null);
    try {
      const storage = MoonStorage.getInstance();
      const imageId = await storage.saveImage(blob);
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      await storage.updateEntry(dateStr, {
        image: imageId,
        moon: 0.5, // TODO: Calculate actual moon phase
        notSeen: false,
      });
      await refreshEntries();
    } catch (error) {
      console.error('Failed to save moon entry:', error);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleRemoveEntry = async () => {
    if (!currentEntry) return;
    const storage = MoonStorage.getInstance();
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    if (currentEntry.image) {
      revokeObjectUrl(currentEntry.image);
    }
    await storage.deleteEntry(dateStr);
    await refreshEntries();
  };

  return (
    <NightSkyBackground>
      <div className="app">
        <div className="app__logo">🌙</div>
        <div className="app__calendar">
          <Calendar selectedDate={selectedDate} onDateSelect={handleDateSelect} entries={entries} />
        </div>
        <div className="app__actions">
          <DateActionsMenu
            selectedDate={selectedDate}
            entry={currentEntry}
            onMarkNotSeen={handleMarkNotSeen}
            onTakePicture={handleTakePicture}
            onPickFromGallery={handlePickFromGallery}
            onRemoveEntry={handleRemoveEntry}
          />
        </div>
      </div>

      {pendingFile && (
        <CropModal
          file={pendingFile}
          onConfirm={handleCropConfirm}
          onCancel={() => setPendingFile(null)}
        />
      )}

      {needRefresh && (
        <div className="update-toast">
          <span>New version available</span>
          <button
            className="actions__btn"
            onClick={() => updateServiceWorker(true)}
            aria-label="Reload"
          >
            <RefreshCw size={20} color="#fff" />
          </button>
          <button onClick={() => setNeedRefresh(false)} aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}
    </NightSkyBackground>
  );
}
