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
  return base62.reduce((acc, e) => acc * BASE + BigInt(BASE_ALPHABET.indexOf(e)), 0n);
}

/**
 * Generates the shortest possible shareable URL.
 * @param {Board} board
 * @param {FullBoard} fullBoard */
export function generateShareURL(board, fullBoard) {
  const
    solution = BigInt(fullBoard.flat().join('')),
    mask = BigInt('0b' + board.flat().map(cell => cell ? '1' : '0').join('')), // parsed as binary
    url = new URL(globalThis.location.href);

  url.searchParams.set('s', bigIntToBase62(solution));
  url.searchParams.set('m', bigIntToBase62(mask));
  url.searchParams.set('d', board.length);

  return url.toString();
}

/**
 * Loads puzzle and solution from the shortest URL format.
 * @returns {{ fullBoard: FullBoard, board: board } | undefined} */
export function loadFromShareURL() {
  const params = new URLSearchParams(globalThis.location.search);
  const compressedSolution = params.get('s');
  const compressedMask = params.get('m');
  const dimension = Number(params.get('d'));

  if (!compressedSolution && !compressedMask && !dimension) return;
  if (!compressedSolution || !compressedMask || !dimension)
    return console.error('Missing URL param. Expected "s", "m" and "d", got', JSON.stringify(Object.fromEntries(params)));

  try {
    const solutionString = base62ToBigInt(compressedSolution).toString().padStart(dimension ** 2, '0');
    const maskString = base62ToBigInt(compressedMask).toString(2).padStart(dimension ** 2, '0'); // toString(2) for binary

    const solutionChars = [...solutionString];
    const board = [];
    const fullBoard = [];

    for (let row = 0, boardRow = [], fullBoardRow = []; row < dimension; row++) {
      for (let col = 0, rowId = row * dimension + col; col < dimension; col++) {
        const solutionDigit = Number(solutionChars[rowId]);

        fullBoardRow.push(solutionDigit);
        boardRow.push(maskString[rowId] === '1' ? solutionDigit : undefined);
      }

      fullBoard.push(fullBoardRow);
      board.push(boardRow);
    }

    return { fullBoard, board };
  }
  catch (err) {
    return console.error('Failed to parse short Sudoku URL:', err);
  }
}