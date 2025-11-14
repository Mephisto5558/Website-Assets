import { difficultySlider, sizeOption } from './constants';
import { updateMinMax } from './utils';

const
  BASE = 62n,
  BASE_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Converts a BigInt to a Base62 string. */
function bigIntToBase62(num: bigint): string {
  if (num === 0n) return '0';

  let str = '';
  /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- calculating index based on `BASE` */
  for (;num > 0n; num /= BASE) str = BASE_ALPHABET[Number(num % BASE)]! + str;

  return str;
}

/** Converts a Base62 string back to a BigInt. */
function base62ToBigInt(base62: string): bigint {
  /* eslint-disable-next-line @typescript-eslint/no-misused-spread -- safe for base62 */
  return [...base62].reduce((acc, e) => acc * BASE + BigInt(BASE_ALPHABET.indexOf(e)), 0n);
}

export function generateShareURL(board: Board, fullBoard: FullBoard): string {
  const
    dimension = BigInt(board.length),
    base = dimension + 1n;

  let solutionBigInt = 0n;
  for (const num of fullBoard.flat())
    solutionBigInt = solutionBigInt * base + BigInt(num);

  const
    data = {
      /* eslint-disable id-length */
      s: solutionBigInt,
      m: BigInt('0b' + board.flat().map(cell => (cell ? '1' : '0')).join('')),
      d: dimension
      /* eslint-enable id-length */
    },
    url = new URL(globalThis.location.href);

  /* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- better-typescript-lib bug */
  for (const [k, v] of Object.entries(data) as [string, bigint][]) url.searchParams.set(k, bigIntToBase62(v));

  return url.toString();
}

export function loadFromShareURL(url: string | URL | undefined): { fullBoard: FullBoard; board: Board } | undefined {
  const
    params = new URLSearchParams(url?.toString() ?? globalThis.location.search),
    compressedDimension = params.get('d'),
    compressedSolution = params.get('s'),
    compressedMask = params.get('m');

  if (!compressedSolution || !compressedMask || !compressedDimension) return;

  try {
    const
      dimension = Number(base62ToBigInt(compressedDimension)),
      totalCells = dimension * dimension,
      base = BigInt(dimension + 1),

      maskString = base62ToBigInt(compressedMask).toString(2).padStart(totalCells, '0');

    sizeOption.value = Math.sqrt(dimension).toString();

    /* eslint-disable-next-line @typescript-eslint/no-misused-spread -- safe for base62 */
    difficultySlider.value = [...maskString].filter(e => Number(e) == 0).length.toString();

    updateMinMax();

    let solutionBigInt = base62ToBigInt(compressedSolution);
    const solutionNumbers = [];
    for (let i = 0; i < totalCells; i++) {
      const remainder = solutionBigInt % base;
      solutionNumbers.push(Number(remainder));
      solutionBigInt /= base;
    }

    solutionNumbers.reverse();

    const
      board: Board = [],
      fullBoard: FullBoard = [];
    for (let rowId = 0; rowId < dimension; rowId++) {
      const
        boardRow = [],
        fullBoardRow = [];

      for (let colId = 0; colId < dimension; colId++) {
        const
          i = rowId * dimension + colId,
          /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- `i` is calculated to always be within `solutionNumbers`. */
          solutionDigit = solutionNumbers[i]!;

        fullBoardRow.push(solutionDigit);
        boardRow.push(maskString[i] === '1' ? solutionDigit : 0);
      }

      board.push(boardRow);
      fullBoard.push(fullBoardRow);
    }

    if (board.length !== dimension || fullBoard.length !== dimension)
      throw new Error(`Failed to construct board of size ${dimension}.`);

    return { fullBoard, board };
  }
  catch (err) {
    console.error('Failed to parse shared Sudoku URL:', err);
    globalThis.history.replaceState({}, '', globalThis.location.pathname);
    return;
  }
}