const allowedAttributes = new Set([
  // general
  'id', 'className', 'title', 'media', 'defer', 'async',

  // <script>
  'type', 'nomodule', 'crossOrigin', 'integrity',

  // <link>
  'rel', 'as', 'crossorigin'
]);

/** @type {import('.')['loadLocal']} */
globalThis.loadLocal = function loadLocal(elementType, localPath, remotePath, args = {}) {
  const elem = document.createElement(elementType === 'css' ? 'link' : elementType);
  elem[elementType === 'css' ? 'href' : 'src'] = ['localhost', '127.0.0.1', ''].includes(location.hostname) ? localPath : remotePath;

  if (elementType === 'css') elem.rel = 'stylesheet';

  for (const [key, value] of Object.entries(args)) {
    if (allowedAttributes.has(key)) {
      if (typeof value === 'boolean') elem[key] = value;
      else elem.setAttribute(key, value);
    }
    else console.warn(`[loadLocal] Ignored disallowed attribute: "${key}" for element "${elementType}" (local: ${localPath}, remote: ${remotePath})`);
  }

  const currentScript = document.currentScript ?? [...document.querySelectorAll('script[src]')].at(-1);
  (currentScript?.parentElement ?? document.head).append(elem);

  delete globalThis.loadLocal;
  currentScript?.remove();
};