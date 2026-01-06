import type * as __ from '@mephisto5558/better-types'; /* eslint-disable-line import-x/no-namespace -- load in global definitions */

declare global {
  /* eslint-disable-next-line @typescript-eslint/consistent-type-definitions */
  interface Body {
    json(): Promise<JSONValue>;
  }
}