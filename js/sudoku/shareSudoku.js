/** @typedef {import('.').FullBoard} FullBoard */
/** @typedef {import('.').Board} Board */

const BASE = 62n;
const BASE_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Converts a BigInt to a Base62 string.
 * @param {bigint} num */
function bigIntToBase62(num) {
  if (num === 0n) return '0';

  let str = '';
  for (;num > 0n; num /= BASE) str = BASE_ALPHABET[Number(num % BASE)] + str;

  return str;
}

/**
 * Converts a Base62 string back to a BigInt.
 * @param {string} base62 */
function base62ToBigInt(base62) {
  return [...base62].reduce((acc, e) => acc * BASE + BigInt(BASE_ALPHABET.indexOf(e)), 0n);
}

/**
 * @param {Board} board
 * @param {FullBoard} fullBoard */
export function generateShareURL(board, fullBoard) {
  const data = {
    /* eslint-disable id-length */
    s: BigInt(fullBoard.flat().join('')),
    m: BigInt('0b' + board.flat().map(cell => cell ? '1' : '0').join('')), // parsed as binary
    d: BigInt(board.length)
    /* eslint-enable id-length */
  };

  const url = new URL(globalThis.location.href);
  for (const [k, v] of Object.entries(data)) url.searchParams.set(k, bigIntToBase62(v));

  return url.toString();
}

/** @returns {{ fullBoard: FullBoard, board: Board } | undefined} */
export function loadFromShareURL() {
  const
    params = new URLSearchParams(globalThis.location.search),
    compressedDimension = params.get('d'),
    compressedSolution = params.get('s'),
    compressedMask = params.get('m');

  if (!compressedSolution && !compressedMask && !compressedDimension) return;
  if (!compressedSolution || !compressedMask || !compressedDimension)
    return console.error('Missing URL param. Expected "s", "m" and "d", got', JSON.stringify(Object.fromEntries(params)));

  try {
    const
      dimension = Number(base62ToBigInt(compressedDimension)),
      solutionString = base62ToBigInt(compressedSolution).toString().padStart(dimension ** 2, '0'),
      maskString = base62ToBigInt(compressedMask).toString(2).padStart(dimension ** 2, '0'), // toString(2) for binary
      board = [],
      fullBoard = [];

    for (let rowId = 0; rowId < dimension; rowId++) {
      const boardRow = [];
      const fullBoardRow = [];

      for (let colId = 0; colId < dimension; colId++) {
        const i = rowId * dimension + colId;
        const solutionDigit = Number(solutionString[i]);

        fullBoardRow.push(solutionDigit);
        boardRow.push(maskString[i] === '1' ? solutionDigit : 0);
      }

      board.push(boardRow);
      fullBoard.push(fullBoardRow);
    }

    return { fullBoard, board };
  }
  catch (err) {
    return console.error('Failed to parse short Sudoku URL:', err);
  }
}