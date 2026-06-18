function pickFile(accept: string, capture?: boolean): Promise<File | null> {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    if (capture) {
      input.setAttribute('capture', 'environment');
    }
    input.style.display = 'none';

    let settled = false;

    const cleanup = () => {
      input.removeEventListener('change', onChange);
      window.removeEventListener('focus', onFocus);
      document.body.removeChild(input);
    };

    const onChange = () => {
      settled = true;
      const file = input.files && input.files[0];
      cleanup();
      resolve(file ?? null);
    };

    // If the user dismisses the picker, no `change` event fires. We use the
    // window `focus` event (fired when the dialog closes) as a fallback: if no
    // file was chosen shortly after, resolve with null.
    const onFocus = () => {
      window.setTimeout(() => {
        if (!settled) {
          cleanup();
          resolve(null);
        }
      }, 300);
    };

    input.addEventListener('change', onChange);
    window.addEventListener('focus', onFocus);
    document.body.appendChild(input);
    input.click();
  });
}

/**
 * Open the OS camera (iOS Safari / Android Chrome hand off to the native
 * camera app via the `capture` attribute). Resolves with the captured File or
 * null if canceled.
 */
export const takePicture = (): Promise<File | null> => pickFile('image/*', true);

/**
 * Open the OS photo/gallery picker. Resolves with the chosen File or null if
 * canceled.
 */
export const pickFromGallery = (): Promise<File | null> => pickFile('image/*', false);
