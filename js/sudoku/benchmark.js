import { REPORT_PROD_WORKER_URL } from './constants.js';

let workerBlobURL;
async function fetchScript(url) {
  const workerScript = await fetch(url).then(res => res.text());
  return URL.createObjectURL(new Blob([workerScript], { type: 'application/javascript' }));
}

let resolveFunction;
async function createSudokuWorker() {
  workerBlobURL ??= await fetchScript(globalThis.debug ? './sudoku.worker.js' : REPORT_PROD_WORKER_URL);
  const sudokuWorker = new Worker(workerBlobURL);

  sudokuWorker.addEventListener('message', e => {
    if (e.data.type == 'result') {
      resolveFunction?.(e.data.payload);
      resolveFunction = undefined;
    }
  });
  sudokuWorker.addEventListener('error', e => console.error('Worker:', e));

  return sudokuWorker;
}

let sudokuWorker;

/**
 * @param {number} size
 * @param {number} runs */
export async function runSudokuBenchmark(size, runs = 10) {
  console.log('%c--- Starting Sudoku Benchmark ---', 'color: yellow; font-weight: bold;');
  console.log(`Board Size: ${size}x${size}, Runs: ${runs}`);

  const durations = [];
  const holesToDig = Math.floor((size * size) * 0.5);// 50% holes

  sudokuWorker ??= await createSudokuWorker();

  for (let run = 1; run <= runs; run++) {
    try {
      console.log(`Run ${run}/${runs}...`);

      const startTime = performance.now();

      await new Promise(resolve => {
        resolveFunction = resolve;
        sudokuWorker.postMessage({ size, holes: holesToDig });
      });

      const endTime = performance.now();
      const duration = endTime - startTime;
      durations.push(duration);

      console.log(`Run ${run} finished in ${duration.toFixed(2)}ms`);
    }
    catch (error) {
      console.error(`Run ${run} failed:`, error);
      break;
    }
  }

  if (durations.length <= 0)
    return console.log('%c--- Benchmark Canceled (no successful runs) ---', 'color: red;');

  const totalDuration = durations.reduce((acc, e) => acc + e, 0);
  const average = totalDuration / durations.length;
  const min = Math.min(...durations);
  const max = Math.max(...durations);

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