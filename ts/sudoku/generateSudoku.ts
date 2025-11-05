/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { getGroupId } from './utils.js';

export function createHTMLBoard(size: number): void {
  const boxSize = Math.sqrt(size);
  if (!Number.isInteger(boxSize)) throw new Error('Size must be quadratic.');

  console.debug(`Creating HTML board of size ${size}`);
  const sudokuTable = document.querySelector<HTMLTableElement>('#sudoku')!;
  sudokuTable.innerHTML = '';

  for (let colGroupI = 0; colGroupI < boxSize; colGroupI++) {
    const colGroup = document.createElement('colgroup');

    for (let colI = 0; colI < boxSize; colI++)
      colGroup.append(document.createElement('col'));

    sudokuTable.append(colGroup);
  }

  for (let bodyI = 0; bodyI < boxSize; bodyI++) {
    const tBody = document.createElement('tbody');

    for (let rowI = 0; rowI < boxSize; rowI++) {
      const
        tRow = document.createElement('tr'),
        rowId = bodyI * boxSize + rowI;

      for (let colId = 0; colId < size; colId++) {
        const
          tCell = document.createElement('td'),
          input = document.createElement('input');

        input.type = 'number';
        input.title = '';
        input.required = true;
        input.autocomplete = 'off';

        input.dataset.row = (rowId + 1).toString();
        input.dataset.col = (colId + 1).toString();
        input.dataset.group = (getGroupId(rowId, colId, boxSize) + 1).toString();
        input.ariaLabel = `Row ${rowId + 1}, Column ${colId + 1}`;

        const notesDiv = document.createElement('div');
        notesDiv.classList.add('notes');

        /* eslint-disable-next-line @typescript-eslint/no-magic-numbers */
        notesDiv.append(...Array.from({ length: 8 }, (_, i) => {
          const noteSpan = document.createElement('span');
          noteSpan.contentEditable = 'plaintext-only';

          /* eslint-disable-next-line @typescript-eslint/no-magic-numbers -- skip no. 5 (middle one) */
          noteSpan.dataset.note = (i + Number(i > 3) + 1).toString();

          return noteSpan;
        }));

        tCell.append(input);
        tCell.append(notesDiv);
        tRow.append(tCell);
      }

      tBody.append(tRow);
    }

    sudokuTable.append(tBody);
  }
}

export function createHTMLOverviewSpans(size: number): HTMLElement {
  const boxSize = Math.sqrt(size);
  if (!Number.isInteger(boxSize)) throw new Error('Size must be quadratic.');

  console.debug(`Creating HTML overview span of size ${size}`);
  const numberOverviewTable = document.querySelector<HTMLTableElement>('#number-overview')!;
  numberOverviewTable.innerHTML = '';

  const tBody = document.createElement('tbody');
  for (let rowId = 0; rowId < boxSize; rowId++) {
    const tRow = document.createElement('tr');

    for (let colId = 0; colId < boxSize; colId++) {
      const
        tCell = document.createElement('td'),
        span = document.createElement('span');

      span.textContent = '0';
      tCell.textContent = `${boxSize * rowId + colId + 1}: `;

      tCell.append(span);
      tRow.append(tCell);
    }

    tBody.append(tRow);
  }

  numberOverviewTable.append(tBody);
  return numberOverviewTable;
}

export function displayBoard(board: Board, htmlBoard: HTMLBoard, numberOverviewSpans: HTMLSpanElement[], isSolution = false): void {
  for (const cell of htmlBoard.flat()) {
    if (!isSolution) cell.classList.remove('solution');
    if (isSolution && !cell.disabled) {
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion */
      if (cell.value) cell.dataset.val = cell.value as `${number}`;
      cell.classList.add('solution');
    }

    cell.value = ((board[Number(cell.dataset.row) - 1]![Number(cell.dataset.col) - 1] ?? 0) || Number(cell.dataset.val) || '').toString();
    cell.disabled = isSolution || !!cell.value && !cell.dataset.val;

    if (!isSolution) delete cell.dataset.val;
  }

  const numberAmts = board.flat().reduce((acc, e) => {
    acc[e - 1]!++;
    return acc;
  }, Array.from({ length: board.length }, () => 0));

  for (const [i, amt] of numberAmts.entries()) {
    numberOverviewSpans[i]!.textContent = amt.toString();
    numberOverviewSpans[i]!.classList.toggle('complete', amt == board.length);
  }
}