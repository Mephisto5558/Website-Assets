export default function createElement<
  TAG_NAME extends keyof HTMLElementTagNameMap,
  ELEM extends HTMLElementTagNameMap[TAG_NAME],
  PARENT extends HTMLElement | DocumentFragment | undefined = undefined
>(
  tagName: TAG_NAME, data?: Partial<{ [K in keyof ELEM]: ELEM[K] }>, parent?: PARENT, replace = false
): ELEM & (PARENT extends undefined ? unknown : { parentElement: PARENT }) {
  const element = document.createElement(tagName);

  if (data) {
    /* eslint-disable @typescript-eslint/no-unsafe-type-assertion -- TODO */
    for (const key of Object.keys(data) as (keyof typeof data)[]) {
      const value = data[key];
      if (value === undefined) continue;
      if (typeof value === 'object' && value != undefined && !Array.isArray(value) && key in element) Object.assign((element as Record<keyof ELEM, object>)[key], value);
      else (element as Record<keyof ELEM, unknown>)[key] = value;
      /* eslint-enable @typescript-eslint/no-unsafe-type-assertion */
    }
  }
  if (parent) replace ? parent.replaceChildren(element) : parent.append(element);

  // @ts-expect-error -- hard to correctly type due to this function's dynamic nature
  return element;
}