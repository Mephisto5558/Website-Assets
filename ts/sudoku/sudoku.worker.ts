globalThis.window = globalThis; // polyfill for rando
globalThis.importScripts('https://cdn.jsdelivr.net/gh/nastyox/Rando.js@master/code/plain-javascript/2.0.0/rando-min.js');

const THROTTLE_INTERVAL_MS = 500;

let lastProgressTimestamp = 0;
function sendProgress(message) {
  const now = Date.now();
  if (now <= lastProgressTimestamp + THROTTLE_INTERVAL_MS) return;
  lastProgressTimestamp = now;
  globalThis.postMessage({ type: 'progress', message });
}

/** @type {import('./index.js')['getGroupId']} */
function getGroupId(rowId, colId, boxSize) {
  return Math.floor(rowId / boxSize) * boxSize + Math.floor(colId / boxSize);
}

/**
 * @param {import('./index.js').Board} board
 * @param {object} options
 * @returns {number} */
function backtrackSolver(board, options = {}) {
  const { findJustOne = true, useRandomSequence = true } = options;
  const size = board.length;
  const boxSize = Math.sqrt(size);

  const rows = Array.from({ length: size }, () => new Set());
  const cols = Array.from({ length: size }, () => new Set());
  const groups = Array.from({ length: size }, () => new Set());
  const emptyCells = [];

  for (let rowId = 0; rowId < size; rowId++) {
    for (let colId = 0; colId < size; colId++) {
      const value = board[rowId][colId];
      if (value === 0)
        emptyCells.push({ rowId, colId });
      else {
        const groupId = getGroupId(rowId, colId, boxSize);
        rows[rowId].add(value);
        cols[colId].add(value);
        groups[groupId].add(value);
      }
    }
  }

  function run(k) {
    if (k >= emptyCells.length) return 1;

    const { rowId, colId } = emptyCells[k];
    const groupId = getGroupId(rowId, colId, boxSize);

    let solutionCount = 0;
    for (const value of useRandomSequence ? randoSequence(1, size) : Array.from({ length: size }, (_, i) => i + 1)) {
      if (!rows[rowId].has(value) && !cols[colId].has(value) && !groups[groupId].has(value)) {
        board[rowId][colId] = value;
        rows[rowId].add(value);
        cols[colId].add(value);
        groups[groupId].add(value);

        const result = run(k + 1);

        if (findJustOne) {
          if (result > 0) return result;
        }
        else {
          solutionCount += result;
          if (solutionCount > 1) {
            rows[rowId].delete(value);
            cols[colId].delete(value);
            groups[groupId].delete(value);
            board[rowId][colId] = 0;
            return solutionCount;
          }
        }

        rows[rowId].delete(value);
        cols[colId].delete(value);
        groups[groupId].delete(value);
        board[rowId][colId] = 0;
      }
    }

    return solutionCount;
  }

  return run(0);
}

/**
 * @param {import('./index.js').Board} board
 * @returns {boolean | undefined}  */
function dig(board) {
  const size = board.length;
  const filledCells = [];
  for (let rowId = 0; rowId < size; rowId++) {
    for (let colId = 0; colId < size; colId++) {
      if (board[rowId][colId] !== 0)
        filledCells.push({ rowId, colId });
    }
  }

  for (const { rowId, colId } of randoSequence(filledCells).map(e => e.value)) {
    const originalValue = board[rowId][colId];
    board[rowId][colId] = 0;

    const solutionCount = backtrackSolver(structuredClone(board), { findJustOne: false, useRandomSequence: false });

    if (solutionCount > 1) {
      board[rowId][colId] = originalValue;
      continue;
    }

    return true;
  }

  return false;
}

function getEmptySudoku(size, filler = 0) {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => filler));
}

function generateSudoku(size, holes) {
  sendProgress(`Generating initial full Sudoku. Size: ${size}`);
  const start = performance.now();
  const fullBoard = getEmptySudoku(size);

  const success = backtrackSolver(fullBoard, { findJustOne: true, useRandomSequence: true }) > 0;

  if (!success) {
    globalThis.postMessage({ type: 'error', message: 'Failed to generate a valid Sudoku board.' });
    return { fullBoard: getEmptySudoku(size), board: getEmptySudoku(size) };
  }
  globalThis.postMessage({ type: 'debug', message: `Took ${performance.now() - start}ms to generate.` });

  const board = structuredClone(fullBoard);
  const maxAttempts = size ** 2;

  sendProgress(`Starting to dig holes. Holes to dig: ${holes}`);
  let removed = 0;
  for (let attempts = 0; removed < holes && attempts < maxAttempts; attempts++) {
    sendProgress(`Digging. Holes: ${removed}/${holes}`);
    if (dig(board)) removed++;
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