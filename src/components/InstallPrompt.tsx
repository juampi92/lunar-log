import { useEffect, useState } from 'react';
import { Download, X, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'lunar-log:install-dismissed';

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari exposes navigator.standalone
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    if (sessionStorage.getItem(DISMISS_KEY) === '1') return;

    setIos(isIOS());

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const onAppInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem(DISMISS_KEY, '1');
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setVisible(false);
      setDeferredPrompt(null);
    } else {
      dismiss();
    }
  };

  if (!visible || isStandalone()) return null;

  // iOS never fires beforeinstallprompt: show instructions instead.
  if (ios && !deferredPrompt) {
    return (
      <div className="install-toast" role="dialog" aria-label="Install Lunar Log">
        <Share size={20} color="#fff" />
        <span className="install-toast__text">
          Tap <strong>Share</strong>, then <strong>Add to Home Screen</strong> to install.
        </span>
        <button className="actions__btn" onClick={dismiss} aria-label="Dismiss">
          <X size={20} color="#fff" />
        </button>
      </div>
    );
  }

  if (!deferredPrompt) return null;

  return (
    <div className="install-toast" role="dialog" aria-label="Install Lunar Log">
      <Download size={20} color="#fff" />
      <span className="install-toast__text">Install Lunar Log for offline use.</span>
      <button className="actions__btn actions__btn--install" onClick={handleInstall} aria-label="Install">
        Install
      </button>
      <button className="actions__btn" onClick={dismiss} aria-label="Dismiss">
        <X size={20} color="#fff" />
      </button>
    </div>
  );
}
