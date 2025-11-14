/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { randomIntSequence, shuffleArray } from '../randomNumberGen';

const THROTTLE_INTERVAL_MS = 500;

let lastProgressTimestamp = 0;
function sendProgress(message: string): void {
  const now = Date.now();
  if (now <= lastProgressTimestamp + THROTTLE_INTERVAL_MS) return;
  lastProgressTimestamp = now;
  globalThis.postMessage({ type: 'progress', message });
}

function getGroupId(rowId: number, colId: number, boxSize: number): number {
  return Math.floor(rowId / boxSize) * boxSize + Math.floor(colId / boxSize);
}

function backtrackSolver(board: Board, options: { findJustOne?: boolean; useRandomSequence?: boolean } = {}): number {
  const
    { findJustOne = true, useRandomSequence = true } = options,
    size = board.length,
    boxSize = Math.sqrt(size),

    rows = Array.from({ length: size }, () => new Set()),
    cols = Array.from({ length: size }, () => new Set()),
    groups = Array.from({ length: size }, () => new Set()),
    emptyCells: { rowId: number; colId: number }[] = [];

  for (let rowId = 0; rowId < size; rowId++) {
    for (let colId = 0; colId < size; colId++) {
      const value = board[rowId]![colId]!;
      if (value === 0)
        emptyCells.push({ rowId, colId });
      else {
        const groupId = getGroupId(rowId, colId, boxSize);
        rows[rowId]!.add(value);
        cols[colId]!.add(value);
        groups[groupId]!.add(value);
      }
    }
  }

  function run(k: number): number {
    if (k >= emptyCells.length) return 1;

    const { rowId, colId } = emptyCells[k]!,
      groupId = getGroupId(rowId, colId, boxSize);

    let solutionCount = 0;
    for (const value of useRandomSequence ? randomIntSequence(1, size) : Array.from({ length: size }, (_, i) => i + 1)) {
      if (!rows[rowId]!.has(value) && !cols[colId]!.has(value) && !groups[groupId]!.has(value)) {
        board[rowId]![colId] = value;
        rows[rowId]!.add(value);
        cols[colId]!.add(value);
        groups[groupId]!.add(value);

        const result = run(k + 1);

        if (findJustOne) {
          if (result > 0) return result;
        }
        else {
          solutionCount += result;
          if (solutionCount > 1) {
            rows[rowId]!.delete(value);
            cols[colId]!.delete(value);
            groups[groupId]!.delete(value);
            board[rowId]![colId] = 0;
            return solutionCount;
          }
        }

        rows[rowId]!.delete(value);
        cols[colId]!.delete(value);
        groups[groupId]!.delete(value);
        board[rowId]![colId] = 0;
      }
    }

    return solutionCount;
  }

  return run(0);
}

function dig(board: Board): boolean {
  const
    size = board.length,
    filledCells = [];

  for (let rowId = 0; rowId < size; rowId++) {
    for (let colId = 0; colId < size; colId++) {
      if (board[rowId]![colId]! !== 0)
        filledCells.push({ rowId, colId });
    }
  }

  for (const { rowId, colId } of shuffleArray(filledCells)) {
    const originalValue = board[rowId]![colId]!;
    board[rowId]![colId] = 0;

    const solutionCount = backtrackSolver(structuredClone(board), { findJustOne: false, useRandomSequence: false });

    if (solutionCount > 1) {
      board[rowId]![colId] = originalValue;
      continue;
    }

    return true;
  }

  return false;
}

/* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion */
function getEmptySudoku<SIZE extends number, FILLER extends string | number = 0>(size: SIZE, filler: FILLER = 0 as FILLER): FILLER[][] & { length: SIZE } {
  /* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion */
  return Array.from({ length: size }, () => Array.from({ length: size }, () => filler)) as FILLER[][] & { length: SIZE };
}

function generateSudoku(size: number, holes: number): { fullBoard: FullBoard; board: Board } {
  sendProgress(`Generating initial full Sudoku. Size: ${size}`);
  const
    start = performance.now(),
    fullBoard: FullBoard = getEmptySudoku(size),

    success = backtrackSolver(fullBoard, { findJustOne: true, useRandomSequence: true }) > 0;

  if (!success) {
    globalThis.postMessage({ type: 'error', message: 'Failed to generate a valid Sudoku board.' });
    return { fullBoard: getEmptySudoku(size), board: getEmptySudoku(size) };
  }
  globalThis.postMessage({ type: 'debug', message: `Took ${performance.now() - start}ms to generate.` });

  const
    board = structuredClone(fullBoard),
    maxAttempts = size ** 2;

  sendProgress(`Starting to dig holes. Holes to dig: ${holes}`);
  let removed = 0;
  for (let attempts = 0; removed < holes && attempts < maxAttempts; attempts++) {
    sendProgress(`Digging. Holes: ${removed}/${holes}`);
    if (dig(board)) removed++;
  }

  sendProgress(`Dug ${removed}/${holes} holes.`);
  return { fullBoard, board };
}

globalThis.addEventListener('message', (event: MessageEvent<{ size: number; holes: number; debugBoard?: boolean }>) => {
  if (event.origin && event.origin !== globalThis.origin)
    return console.warn(`Worker received a message from an untrusted origin: "${event.origin}". Ignoring.`);

  console.log('Worker: Task received from main thread.');

  const { size, holes, debugBoard = false } = event.data;

  globalThis.debugBoard = debugBoard;

  const result = generateSudoku(size, holes);

  console.log('Worker: Task finished, posting result back.');
  globalThis.postMessage({ type: 'result', result });
});