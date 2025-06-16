import type Sweetalert2 from 'sweetalert2';

declare global {
  // @ts-expect-error must be done this way to work
  const Swal = Sweetalert2;

  function rando(min: number, max?: number): number;
  function randoSequence<val>(arr: val[]): { index: number; value: val }[];
  function randoSequence(min: number, max?: number): number[];
}