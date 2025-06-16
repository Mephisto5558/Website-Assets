globalThis.window = globalThis; // polyfill for rando
globalThis.importScripts('https://cdn.jsdelivr.net/gh/nastyox/Rando.js@master/code/plain-javascript/2.0.0/rando-min.js');

const THROTTLE_INTERVAL_MS = 500;

/** @type {import('.')['getGroupId']} */
function getGroupId(rowId, colId, boxSize) {
  return Math.floor(rowId / boxSize) * boxSize + Math.floor(colId / boxSize);
}

let lastProgressTimestamp;
function sendProgress(message) {
  const now = Date.now();
  if (now <= lastProgressTimestamp + THROTTLE_INTERVAL_MS) return;

  lastProgressTimestamp = now;
  return globalThis.postMessage({ type: 'progress', message });
}

/**
 * @param {import('.').Board} board
 * @param {object | undefined} options
 * @param {boolean} options.findJustOne
 * @param {boolean} options.useRandomSequence */
function solver(board, { findJustOne = true, useRandomSequence = true } = {}) {
  const size = board.length;
  const boxSize = Math.sqrt(size);

  const rows = Array.from({ length: size }, () => new Set());
  const cols = Array.from({ length: size }, () => new Set());
  const boxes = Array.from({ length: size }, () => new Set());

  for (let rowId = 0; rowId < size; rowId++) {
    for (let colId = 0; colId < size; colId++) {
      const value = board[rowId][colId];
      if (value === 0) continue;

      rows[rowId].add(value);
      cols[colId].add(value);
      boxes[getGroupId(rowId, colId, boxSize)].add(value);
    }
  }

  function run(rowId = 0, colId = 0) {
    if (rowId >= size) return 1;

    const [nextRowId, nextColId] = colId === size - 1 ? [rowId + 1, 0] : [rowId, colId + 1];
    if (board[rowId][colId] !== 0) return run(nextRowId, nextColId);

    sendProgress(`Generating row ${rowId.toString().padStart(board.length.toString().length, '0')}/${board.length}, column ${colId.toString().padStart(board.length.toString().length, '0')}/${board.length}`);

    const boxId = getGroupId(rowId, colId, boxSize);
    const valuesToTry = useRandomSequence ? randoSequence(1, size) : Array.from({ length: size }, (_, i) => i + 1);

    let solutionCount = 0;

    for (const value of valuesToTry) {
      if (rows[rowId].has(value) || cols[colId].has(value) || boxes[boxId].has(value)) continue;

      board[rowId][colId] = value;
      rows[rowId].add(value);
      cols[colId].add(value);
      boxes[boxId].add(value);

      const result = run(nextRowId, nextColId);

      if (findJustOne) {
        if (result > 0) return solutionCount + result;
      }
      else {
        solutionCount += result;
        if (solutionCount > 1) {
          rows[rowId].delete(value);
          cols[colId].delete(value);
          boxes[boxId].delete(value);
          board[rowId][colId] = 0;

          return solutionCount;
        }
      }

      rows[rowId].delete(value);
      cols[colId].delete(value);
      boxes[boxId].delete(value);
      board[rowId][colId] = 0;
    }

    return solutionCount;
  }

  const result = run();
  return findJustOne ? result > 0 : result;
}

function dig(board) {
  const rowId = rando(0, board.length - 1);
  const colId = rando(0, board.length - 1);
  if (!board[rowId][colId]) return;

  const originalValue = board[rowId][colId];
  board[rowId][colId] = 0;

  if (solver(structuredClone(board), { findJustOne: false, useRandomSequence: false }) > 1) {
    board[rowId][colId] = originalValue;
    return false;
  }

  return true;
}

/**
 * @param {number} size
 * @param {any} filler */
function getEmptySudoku(size, filler = 0) {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => filler));
}

/**
 * @param {number} size
 * @param {number} holes
 * @throws {Error} on non-quadratic numbers */
function generateSudoku(size, holes) {
  const boxSize = Math.sqrt(size);
  if (!Number.isInteger(boxSize)) throw new Error('Size must be quadratic.');

  sendProgress(`Generating initial full Sudoku. Size: ${size}`);
  const start = performance.now();

  const fullBoard = getEmptySudoku(size);
  const success = solver(fullBoard, { findJustOne: true, useRandomSequence: true });

  if (!success) {
    globalThis.postMessage({ type: 'error', message: 'Failed to generate a valid Sudoku board.' });
    return { fullBoard: getEmptySudoku(size), board: getEmptySudoku(size) };
  }

  globalThis.postMessage({ type: 'debug', message: `Took ${performance.now() - start}ms to generate.` });

  const board = structuredClone(fullBoard);
  const maxAttempts = size ** 2 * 3; /* eslint-disable-line @typescript-eslint/no-magic-numbers -- arbitrary */
  const maxConsecutiveAttempts = size ** 2;

  sendProgress(`Starting to dig holes. Holes to dig: ${holes}`);

  let
    removed = 0,
    attempts = 0,
    consecutiveAttempts = 0;
  for (; removed < holes && attempts < maxAttempts && consecutiveAttempts < maxConsecutiveAttempts; attempts++) {
    sendProgress(`Digging. Holes: ${removed}/${holes}, Attempts: ${attempts}/${maxAttempts}, Consecutive attempts: ${consecutiveAttempts}/${maxConsecutiveAttempts}`);

    const success = dig(board);
    if (success) {
      consecutiveAttempts = 0;
      removed++;
    }
    else if (success === false) consecutiveAttempts++;
  }

  sendProgress(`Dug ${removed}/${holes} holes.`);

  return { fullBoard, board };
}

globalThis.addEventListener('message', event => {
  if (event.origin && event.origin !== globalThis.origin)
    return console.warn(`Worker received a message from an untrusted origin: "${event.origin}". Ignoring.`);

  console.log('Worker: Task received from main thread.');

  const { size, holes, debugBoard } = event.data;

  globalThis.debugBoard = debugBoard;

  const result = generateSudoku(size, holes);

  console.log('Worker: Task finished, posting result back.');
  globalThis.postMessage({ type: 'result', payload: result });
});