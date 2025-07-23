/** @type {import('.')['createElement']} */
export function createElement(tagName, data, parent, replace) {
  const element = document.createElement(tagName);
  if (Object.keys(data ?? {}).length) {
    for (const [k, v] of Object.entries(data)) {
      if (v == undefined) continue;
      if (typeof v == 'object') Object.assign(element[k], v);
      else element[k] = v;
    }
  }
  if (parent) replace ? parent.replaceChildren(element) : parent.append(element);
  return element;
}