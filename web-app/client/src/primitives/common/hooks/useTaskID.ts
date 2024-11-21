import { atom, useAtom } from 'jotai';
import { useCallback, useEffect } from 'react';
import { useReportsRouter } from '@components/useReportsRouter';
import {
  dependenciesFilterAtom,
  pieChartDataAtom,
  pieChartLoadingAtom,
  taskIDAtom,
  prevTaskIDAtom,
  taskIDChangedAtom,
  defaultDataAtom,
  selectedDependencyAtom,
  errorDependencyAtom,
  specificTaskIDAtom,
  datasetAtom,
  taskInfoAtom,
} from '../store';

export const useTaskID = () => {
  const { taskID: routerTaskID } = useReportsRouter();
  const [taskID, setTaskID] = useAtom(taskIDAtom);
  const [pieChartData, setPieChartData] = useAtom(pieChartDataAtom);
  const [prevTaskID, setPrevTaskID] = useAtom(prevTaskIDAtom);
  const [taskIDChanged, setTaskIDChanged] = useAtom(taskIDChangedAtom);
  const [, setDefaultData] = useAtom(defaultDataAtom);
  const [, setDependenciesFilter] = useAtom(dependenciesFilterAtom);
  const [, setSelectedDependency] = useAtom(selectedDependencyAtom);
  const [, setErrorDependency] = useAtom(errorDependencyAtom);
  const [, setSpecificTaskID] = useAtom(specificTaskIDAtom);
  const [, setDataset] = useAtom(datasetAtom);
  const [, setPieChartLoading] = useAtom(pieChartLoadingAtom);
  const [, setTaskInfo] = useAtom(taskInfoAtom);

  setTaskIDChanged(taskID != routerTaskID);

  useEffect(() => {
    setTaskIDChanged(taskID !== prevTaskID);
    if (routerTaskID && routerTaskID !== taskID) {
      setDefaultData(undefined);
      setDependenciesFilter({ rhs: [], lhs: [] });
      setSelectedDependency([]);
      setErrorDependency([]);
      setSpecificTaskID(undefined);
      setDataset(undefined);
      setPieChartData(undefined);
      setPieChartLoading(undefined);
      setTaskInfo(undefined);

      setPrevTaskID(taskID);
      setTaskIDChanged(true); // очищать сторы при смене ID
      setTaskID(routerTaskID);
    }
  }, [
    routerTaskID,
    taskID,
    setTaskID,
    setPrevTaskID,
    setTaskIDChanged,
    setDefaultData,
    setDependenciesFilter,
    setSelectedDependency,
    setErrorDependency,
    setSpecificTaskID,
    setDataset,
    setPieChartData,
    setPieChartLoading,
    setTaskInfo,
  ]);
  return { taskID, taskIDChanged };
};
