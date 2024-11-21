import { useAtom } from 'jotai';
import { useQuery } from '@apollo/client';
import { useEffect } from 'react';
import {
  getPieChartData,
  getPieChartDataVariables,
} from '@graphql/operations/queries/__generated__/getPieChartData';
import { GET_PIE_CHART_DATA } from '@graphql/operations/queries/getPieChartData';
import { useTaskID } from '../../common/hooks/useTaskID';
import {
  dependenciesFilterAtom,
  pieChartDataAtom,
  pieChartLoadingAtom,
} from '../store';

export const useFDStatistics = () => {
  const { taskID, taskIDChanged } = useTaskID();
  const [dependenciesFilter, setDependenciesFilter] = useAtom(
    dependenciesFilterAtom,
  );
  const [pieChartData, setPieChartData] = useAtom(pieChartDataAtom);
  const [pieChartLoading, setPieChartLoading] = useAtom(pieChartLoadingAtom);

  useEffect(() => {
    if (taskIDChanged) {
      setDependenciesFilter({ rhs: [], lhs: [] });
      setPieChartData(undefined);
      setPieChartLoading(undefined);
    }
  }, [
    taskIDChanged,
    setDependenciesFilter,
    setPieChartData,
    setPieChartLoading,
  ]);

  const shouldFetch = !pieChartData && !pieChartLoading;

  const { data, loading } = useQuery<getPieChartData, getPieChartDataVariables>(
    GET_PIE_CHART_DATA,
    {
      variables: { taskID },
      skip: !taskID || !shouldFetch,
    },
  );

  useEffect(() => {
    if (data) setPieChartData(data);
  }, [data, setPieChartData]);

  useEffect(() => {
    setPieChartLoading(loading);
  }, [loading, setPieChartLoading]);

  return {
    dependenciesFilter,
    setDependenciesFilter,
    pieChartData,
    pieChartLoading,
  };
};
