// Class name helper used by every shadcn component: joins classes and lets a
// later Tailwind class override an earlier one (px-2 then px-4 keeps px-4).
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
