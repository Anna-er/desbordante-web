import { atom } from 'jotai';
import { getTaskInfo } from '@graphql/operations/queries/__generated__/getTaskInfo';
import { GeneralColumn } from '@utils/convertDependencies';
import { getPieChartData } from '@graphql/operations/queries/__generated__/getPieChartData';
import { getDataset } from '@graphql/operations/queries/__generated__/getDataset';
import { GetMainTaskDeps } from '@graphql/operations/queries/__generated__/GetMainTaskDeps';

// Atom definitions тут
export const dependenciesFilterAtom = atom<{ rhs: number[]; lhs: number[] }>({
  rhs: [],
  lhs: [],
});
export const pieChartDataAtom = atom<getPieChartData | undefined>(undefined);
export const pieChartLoadingAtom = atom<boolean | undefined>(undefined);
