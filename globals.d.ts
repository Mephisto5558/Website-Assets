import type Sweetalert2 from 'sweetalert2';

declare global {
  // @ts-expect-error must be done this way to work
  const Swal = Sweetalert2;
}