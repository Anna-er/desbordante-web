import { atom, useAtom } from 'jotai';
import { getTaskInfo, getTaskInfoVariables } from '@graphql/operations/queries/__generated__/getTaskInfo';
import { GeneralColumn } from '@utils/convertDependencies';
import {
  getPieChartData,
  getPieChartDataVariables,
} from '@graphql/operations/queries/__generated__/getPieChartData';
import {
  getDataset,
  getDatasetVariables,
} from '@graphql/operations/queries/__generated__/getDataset';
import {
  GetMainTaskDeps,
  GetMainTaskDepsVariables,
} from '@graphql/operations/queries/__generated__/GetMainTaskDeps';

export const taskIDAtom = atom<string>('');
export const defaultDataAtom = atom<GetMainTaskDeps | undefined>(undefined);
export const dependenciesFilterAtom = atom<{ rhs: number[], lhs: number[] }>({ rhs: [], lhs: [] });
export const selectedDependencyAtom = atom<GeneralColumn[]>([]);
export const errorDependencyAtom = atom<GeneralColumn[]>([]);
export const specificTaskIDAtom = atom<string | undefined>(undefined);
export const datasetAtom = atom<getDataset | undefined>(undefined);
export const pieChartDataAtom = atom<getPieChartData | undefined>(undefined);
export const pieChartLoadingAtom = atom<boolean | undefined>(undefined);
export const prevTaskIDAtom = atom<string | null>(null);
export const taskIDChangedAtom = atom<boolean>(false);
export const taskInfoAtom = atom<getTaskInfo | undefined>(undefined);