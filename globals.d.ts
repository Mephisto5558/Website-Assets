import type Sweetalert2 from 'sweetalert2';

declare global {
  // @ts-expect-error ...
  const Swal = Sweetalert2;
}