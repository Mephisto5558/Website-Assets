globalThis.loadLocal = function loadLocal(elementType, localPath, remotePath) {
  const elem = document.createElement(elementType == 'css' ? 'link' : elementType);
  elem[elementType == 'css' ? 'href' : 'src'] = ['localhost', '127.0.0.1', ''].includes(location.hostname) ? localPath : remotePath;

  if (elementType == 'css') elem.rel = 'stylesheet';

  const currentScript = document.currentScript ?? [...document.querySelectorAll('script[src]')].at(-1);
  (currentScript?.parentElement ?? document.head).append(elem);

  delete globalThis.loadLocal;
  currentScript?.remove();
};