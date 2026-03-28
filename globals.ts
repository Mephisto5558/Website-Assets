/* eslint-disable-next-line unicorn/require-module-specifiers */
export {};

declare global {
  /* eslint-disable-next-line @typescript-eslint/consistent-type-definitions */
  interface Body {
    json(): Promise<JSONValue>;
  }
}