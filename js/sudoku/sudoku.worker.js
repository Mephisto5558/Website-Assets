globalThis.window = globalThis; // polyfill for rando
globalThis.importScripts('https://cdn.jsdelivr.net/gh/nastyox/Rando.js@master/code/plain-javascript/2.0.0/rando-min.js');

const DEBUG_BOARDS = {
  board: [
    /* eslint-disable @typescript-eslint/no-magic-numbers */
    [6, 5, 8, 4, 2, 0, 0, 0, 0],
    [0, 2, 3, 7, 0, 0, 4, 0, 0],
    [4, 1, 7, 6, 0, 9, 0, 0, 5],
    [0, 0, 6, 8, 0, 5, 7, 4, 2],
    [0, 9, 2, 3, 0, 7, 5, 6, 1],
    [7, 4, 5, 1, 6, 2, 9, 0, 8],
    [0, 0, 1, 5, 0, 4, 2, 8, 0],
    [0, 7, 0, 9, 8, 0, 0, 5, 0],
    [5, 0, 9, 2, 0, 3, 6, 0, 4]
  ],
  fullBoard: [
    [6, 5, 8, 4, 2, 1, 3, 9, 7],
    [9, 2, 3, 7, 5, 8, 4, 1, 6],
    [4, 1, 7, 6, 3, 9, 8, 2, 5],
    [1, 3, 6, 8, 9, 5, 7, 4, 2],
    [8, 9, 2, 3, 4, 7, 5, 6, 1],
    [7, 4, 5, 1, 6, 2, 9, 3, 8],
    [3, 6, 1, 5, 7, 4, 2, 8, 9],
    [2, 7, 4, 9, 8, 6, 1, 5, 3],
    [5, 8, 9, 2, 1, 3, 6, 7, 4]
    /* eslint-enable @typescript-eslint/no-magic-numbers */
  ]
};

/** @type {import('.')['getGroupId']} */
function getGroupId(rowId, colId, boxSize) {
  return Math.floor(rowId / boxSize) * boxSize + Math.floor(colId / boxSize);
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
        if (result > 0) return result;
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
  if (globalThis.debugBoard) return DEBUG_BOARDS;

  const boxSize = Math.sqrt(size);
  if (!Number.isInteger(boxSize)) throw new Error('Size must be quadratic.');

  globalThis.postMessage({ type: 'progress', message: `Generating initial full Sudoku. Size: ${size}` });
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

  globalThis.postMessage({ type: 'progress', message: `Starting to dig holes. Holes to dig: ${holes}` });

  let
    removed = 0,
    attempts = 0,
    consecutiveAttempts = 0;
  for (; removed < holes && attempts < maxAttempts && consecutiveAttempts < maxConsecutiveAttempts; attempts++) {
    globalThis.postMessage({ type: 'progress', message: `Digging. Holes: ${removed}/${holes}, Attempts: ${attempts}/${maxAttempts}, Consecutive attempts: ${consecutiveAttempts}/${maxConsecutiveAttempts}` });

    const success = dig(board);
    if (success) {
      consecutiveAttempts = 0;
      removed++;
    }
    else if (success === false) consecutiveAttempts++;
  }

  globalThis.postMessage({ type: 'progress', message: `Dug ${removed}/${holes} holes.` });

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