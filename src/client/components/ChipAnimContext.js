import { createContext } from 'react';
export const ChipAnimContext = createContext({
    register: () => { },
    hiding: new Set(),
});
