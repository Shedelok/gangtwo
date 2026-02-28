import { createContext } from 'react';

export interface ChipAnimCtxValue {
  register: (key: string, el: HTMLDivElement | null) => void;
  hiding: Set<string>;
}

export const ChipAnimContext = createContext<ChipAnimCtxValue>({
  register: () => {},
  hiding: new Set(),
});
