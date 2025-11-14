/* eslint-disable @typescript-eslint/no-non-null-assertion */

const
  randomBuffer = new Uint32Array(1),
  divisor32 = 4_294_967_296; // is 2**32;

/**
 * Creates a cryptographically secure random number between `min` (inclusive) and `max` (exclusive).
 * `min` must be < `max`. */
export function randomInt(min: number, max: number): number {
  const range = max - min;

  globalThis.crypto.getRandomValues(randomBuffer);
  return Math.floor((randomBuffer[0]! / divisor32) * range) + min;
}

/**
 * Creates an cryptographically secure random array of numbers from `min` (inclusive) to `max` (inclusive).
 * `min` must be < `max`. */
export function randomIntSequence(min: number, max: number): number[] {
  const
    length = max - min + 1,
    array: number[] = new Array(length); /* eslint-disable-line sonarjs/array-constructor -- faster */

  for (let i = 0; i < length; i++) array[i] = min + i;
  return shuffleArray(array);
}

/** Shuffles an array in-place using the Fisher-Yates algorithm and cryptographically secure random numbers. */
export function shuffleArray<T>(array: T[]): T[] {
  const randomValues = new Uint32Array(array.length - 1);
  globalThis.crypto.getRandomValues(randomValues);

  for (let i = array.length - 1; i > 0; i--) {
    const
      randomIndex = Math.floor((randomValues[i - 1]! / divisor32) * (i + 1)),
      temp = array[i]!;

    array[i] = array[randomIndex]!;
    array[randomIndex] = temp;
  }

  return array;
}