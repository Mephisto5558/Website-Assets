const
  generalAttributes = ['id', 'className', 'title', 'media'] as const,
  scriptAttributes = ['defer', 'async', 'type', 'nomodule', 'crossOrigin', 'integrity'] as const,
  linkAttributes = ['rel', 'as', 'crossorigin'] as const;

type ElementSpecificAttributes<T extends 'css' | 'script'> = T extends 'css' ? typeof linkAttributes[number] : typeof scriptAttributes[number];
type AllowedArgs<T extends 'css' | 'script'> = Partial<Record<typeof generalAttributes[number] | ElementSpecificAttributes<T>, string | boolean>>;

export default function loadLocal<T extends 'css' | 'script'>(elementType: T, localPath: string, remotePath: string, args: AllowedArgs<T> = {}): void {
  const
    elem = document.createElement(elementType === 'css' ? 'link' : 'script'),
    path = ['localhost', '127.0.0.1', ''].includes(location.hostname) ? localPath : remotePath;

  if (elem instanceof HTMLLinkElement) {
    elem.href = path;
    elem.rel = 'stylesheet';
  }
  else elem.src = path;

  const allowedAttributesForElement = new Set<string>([...generalAttributes, ...elementType === 'css' ? linkAttributes : scriptAttributes]);

  for (const [key, value] of Object.entries(args)) {
    if (allowedAttributesForElement.has(key)) {
      if (value === true) elem.setAttribute(key, '');
      else if (value === false) elem.removeAttribute(key);
      /* eslint-disable-next-line @typescript-eslint/no-base-to-string */
      else if (value !== undefined && value !== null) elem.setAttribute(key, String(value));
    }
    else console.warn(`[loadLocal] Ignored disallowed attribute: "${key}" for element "${elementType}" (local: ${localPath}, remote: ${remotePath})`);
  }

  const currentScript = document.currentScript ?? [...document.querySelectorAll<HTMLScriptElement>('script[src]')].at(-1);
  (currentScript?.parentElement ?? document.head).append(elem);

  currentScript?.remove();
}