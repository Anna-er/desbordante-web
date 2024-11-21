import { atom } from 'jotai';
import { GeneralColumn } from '@utils/convertDependencies';

// Atom definitions
export const selectedDependencyAtom = atom<GeneralColumn[]>([]);
export const specificTaskIDAtom = atom<string | undefined>(undefined);
export const datasetHeaderAtom = atom<string[] | undefined>(undefined);
