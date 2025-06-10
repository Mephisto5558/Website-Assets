/** @type {import('.')['setRootStyle']} */
export function setRootStyle(key, value, priority) {
  return document.documentElement.style.setProperty(key, value, priority);
}

/** @type {import('.')['getRootStyle']} */
export function getRootStyle(key) {
  return globalThis.getComputedStyle(document.documentElement).getPropertyValue(key);
}

/** @type {import('.')['invertHex']} */
export function invertHex(hex) {
  hex = hex.replace('#', '');
  /* eslint-disable-next-line @typescript-eslint/no-magic-numbers -- hex math */
  return '#' + (hex.length == 3 ? [...hex] : hex.match(/\w{2}/g)).map(e => (255 - Number.parseInt(e, 16)).toString(16).padStart(2, '0')).join('');
}

/** @type {import('.')['saveToClipboard']} */
export async function saveToClipboard(value) {
  /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/strict-boolean-expressions -- is `undefined` on HTTP pages */
  if (globalThis.navigator.clipboard) {
    await globalThis.navigator.clipboard.writeText(value);
    return alert('Saved the link in your clipboard.');
  }

  const copyArea = document.createElement('textarea');
  copyArea.value = value;
  copyArea.style.display = 'none';

  document.body.append(copyArea);
  copyArea.focus({ preventScroll: true });
  copyArea.select();

  try {
    /* eslint-disable-next-line @typescript-eslint/no-deprecated -- workaround for HTTP context*/
    if (!document.execCommand('copy')) throw new Error('Did not save');
    alert('Saved the link in your clipboard.');
  }
  catch (err) {
    console.error('Could not copy to clipboard using document.execCommand:', err);
    alert('Cold not copy the URL to your clipboard. Please copy it manually from the address bar.');
  }

  copyArea.remove();
}

/** @type {import('.')['initializeColorPicker']} */
export function initializeColorPicker(picker, storageKey, onColorChange) {
  const savedColor = localStorage.getItem(storageKey);
  picker.value = savedColor ?? getRootStyle(picker.dataset.cssProperty).trim();

  if (savedColor) onColorChange(savedColor);
  picker.addEventListener('change', event => {
    const newColor = event.target.value;
    localStorage.setItem(storageKey, newColor);
    onColorChange(newColor);
  });
}

/** @type {import('.')['getGroupId']} */
export function getGroupId(rowId, colId, boxSize) {
  return Math.floor(rowId / boxSize) * boxSize + Math.floor(colId / boxSize);
}