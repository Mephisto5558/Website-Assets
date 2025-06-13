/** @typedef {import('.').Board} Board */

import { getGroupId } from './utils.js';

/**
 * @param {number} size
 * @throws {Error} on non-quadratic numbers */
export function createHTMLBoard(size) {
  const boxSize = Math.sqrt(size);
  if (!Number.isInteger(boxSize)) throw new Error('Size must be quadratic.');

  console.debug(`Creating HTML board of size ${size}`);
  const sudokuTable = document.querySelector('#sudoku');
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
      const tRow = document.createElement('tr');
      const rowId = bodyI * boxSize + rowI;

      for (let colId = 0; colId < size; colId++) {
        const tCell = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'number';
        input.title = '';
        input.required = true;
        input.autocomplete = 'off';

        input.dataset.row = rowId + 1;
        input.dataset.col = colId + 1;
        input.dataset.group = getGroupId(rowId, colId, boxSize) + 1;
        input.ariaLabel = `Row ${rowId + 1}, Column ${colId + 1}`;

        const notesDiv = document.createElement('div');
        notesDiv.classList.add('notes');
        notesDiv.append(...Array.from({ length: 8 }, (_, i) => {
          const noteSpan = document.createElement('span');
          noteSpan.contentEditable = 'plaintext-only';

          noteSpan.dataset.note = i + Number(i > 3) + 1; // skip no. 5 (middle one)

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

/**
 * @param {number} size
 * @throws {Error} on non-quadratic numbers */
export function createHTMLOverviewSpans(size) {
  const boxSize = Math.sqrt(size);
  if (!Number.isInteger(boxSize)) throw new Error('Size must be quadratic.');

  console.debug(`Creating HTML overview span of size ${size}`);
  const numberOverviewTable = document.querySelector('#number-overview');
  numberOverviewTable.innerHTML = '';

  const tBody = document.createElement('tbody');
  for (let rowId = 0; rowId < boxSize; rowId++) {
    const tRow = document.createElement('tr');

    for (let colId = 0; colId < boxSize; colId++) {
      const tCell = document.createElement('td');
      const span = document.createElement('span');

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

/**
 * @param {Board} board
 * @param {import('.').HTMLBoard} htmlBoard
 * @param {HTMLSpanElement[]} numberOverviewSpans
 * @param {boolean} isSolution */
export function displayBoard(board, htmlBoard, numberOverviewSpans, isSolution = false) {
  for (const cell of htmlBoard.flat()) {
    if (!isSolution) cell.classList.remove('solution');
    if (isSolution && !cell.disabled) {
      if (cell.value) cell.dataset.val = cell.value;
      cell.classList.add('solution');
    }

    cell.value = board[Number(cell.dataset.row) - 1][Number(cell.dataset.col) - 1] || Number(cell.dataset.val) || undefined;
    cell.disabled = isSolution || !!cell.value && !cell.dataset.val;

    if (!isSolution) delete cell.dataset.val;
  }

  const numberAmts = board.flat().reduce((acc, e) => {
    acc[e - 1]++;
    return acc;
  }, Array.from({ length: board.length }, () => 0));

  for (const [i, amt] of numberAmts.entries()) {
    numberOverviewSpans[i].textContent = amt;
    numberOverviewSpans[i].classList[amt == board.length ? 'add' : 'remove']('complete');
  }
}