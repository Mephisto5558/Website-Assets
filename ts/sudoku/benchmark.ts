/* eslint-disable require-atomic-updates */

import { REPORT_PROD_WORKER_URL } from './constants';

let workerBlobURL: string | undefined;
async function fetchScript(url: string): Promise<string> {
  const workerScript = await fetch(url).then(async res => res.text());
  return URL.createObjectURL(new Blob([workerScript], { type: 'application/javascript' }));
}

let resolveFunction: ((value?: unknown) => void) | undefined;
async function createSudokuWorker(): Promise<Worker> {
  workerBlobURL ??= await fetchScript(globalThis.debug ? './sudoku.worker.js' : REPORT_PROD_WORKER_URL);
  const sudokuWorker = new Worker(workerBlobURL);

  sudokuWorker.addEventListener('message', (e: MessageEvent<{ type: string; payload?: unknown }>) => {
    if (e.data.type == 'result') {
      resolveFunction?.(e.data.payload);
      resolveFunction = undefined;
    }
  });
  sudokuWorker.addEventListener('error', e => console.error('Worker:', e));

  return sudokuWorker;
}

let sudokuWorker: Worker | undefined;

/* eslint-disable-next-line import-x/prefer-default-export */
export async function runSudokuBenchmark(size: number, runs = 10): Promise<number | undefined> {
  console.log('%c--- Starting Sudoku Benchmark ---', 'color: yellow; font-weight: bold;');
  console.log(`Board Size: ${size}x${size}, Runs: ${runs}`);

  const
    durations = [],

    /* eslint-disable-next-line @typescript-eslint/no-magic-numbers -- 50% holes */
    holesToDig = Math.floor((size * size) * 0.5);

  sudokuWorker ??= await createSudokuWorker();

  for (let run = 1; run <= runs; run++) {
    try {
      console.log(`Run ${run}/${runs}...`);

      const startTime = performance.now();

      await new Promise(resolve => {
        resolveFunction = resolve;
        /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
        sudokuWorker!.postMessage({ size, holes: holesToDig });
      });

      const
        endTime = performance.now(),
        duration = endTime - startTime;

      durations.push(duration);

      console.log(`Run ${run} finished in ${duration.toFixed(2)}ms`);
    }
    catch (err) {
      console.error(`Run ${run} failed:`, err);
      break;
    }
  }

  if (durations.length <= 0) {
    console.log('%c--- Benchmark Canceled (no successful runs) ---', 'color: red;');
    return;
  }

  const
    totalDuration = durations.reduce((acc, e) => acc + e, 0),
    average = totalDuration / durations.length,
    min = Math.min(...durations),
    max = Math.max(...durations);

  console.log('%c--- Benchmark Finished ---', 'color: yellow; font-weight: bold;');
  console.table({
    'Board Size': `${size}x${size}`,
    'Total Runs': durations.length,
    'Average Time (ms)': average.toFixed(2),
    'Min Time (ms)': min.toFixed(2),
    'Max Time (ms)': max.toFixed(2)
  });

  return average;
}