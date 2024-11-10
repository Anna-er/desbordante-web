import { atom, useAtom } from 'jotai';
import { useQuery, useMutation } from '@apollo/client';
import { useEffect, useRef } from 'react';
import { GET_TASK_INFO } from '@graphql/operations/queries/getTaskInfo';
import { getTaskInfo, getTaskInfoVariables } from '@graphql/operations/queries/__generated__/getTaskInfo';
import { CREATE_SPECIFIC_TASK } from '@graphql/operations/mutations/createSpecificTask';
import { createSpecificTask, createSpecificTaskVariables } from '@graphql/operations/mutations/__generated__/createSpecificTask';
import { useReportsRouter } from '@components/useReportsRouter';
import { GeneralColumn } from '@utils/convertDependencies';
import { useErrorContext } from '@hooks/useErrorContext';
import useClustersPreview from '@hooks/useClustersPreview';
import { OrderDirection, PrimitiveType, SpecificTaskType } from 'types/globalTypes';
import {
  getPieChartData,
  getPieChartDataVariables,
} from '@graphql/operations/queries/__generated__/getPieChartData';
import { getSortingParams } from '@components/Filters';
import {
  getDataset,
  getDatasetVariables,
} from '@graphql/operations/queries/__generated__/getDataset';
import { GET_DATASET } from '@graphql/operations/queries/getDataset';
import { GET_MAIN_TASK_DEPS } from '@graphql/operations/queries/getDeps';
import {
  GetMainTaskDeps,
  GetMainTaskDepsVariables,
} from '@graphql/operations/queries/__generated__/GetMainTaskDeps';
import { GET_PIE_CHART_DATA } from '@graphql/operations/queries/getPieChartData';

const DEFAULT_LIMIT = 30;

// Atom definitions
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

// TaskInfo Atom (проблема с дублированием запросов)
export const taskInfoAtom = atom(() => {
  const {taskID, taskIDChanged} = useTaskID();
  if (!taskID) return null;

  if (!(!taskID || !taskIDChanged)) console.log(' FETCH TASK INFO ');

  const { data } = useQuery<getTaskInfo, getTaskInfoVariables>(GET_TASK_INFO, {
    variables: { taskID },
    skip: !taskID || !taskIDChanged,
  });

  return data ? data.taskInfo : null;
});


export const useTaskID = () => {
  const { taskID: routerTaskID } = useReportsRouter();
  const [taskID, setTaskID] = useAtom(taskIDAtom);
  const [prevTaskID, setPrevTaskID] = useAtom(prevTaskIDAtom);
  const [taskIDChanged, setTaskIDChanged] = useAtom(taskIDChangedAtom);

  useEffect(() => {
    if (routerTaskID && routerTaskID !== taskID) {
      setTaskID(routerTaskID);
    }
  }, [routerTaskID, taskID, setTaskID]);

  useEffect(() => {
    setTaskIDChanged(taskID !== prevTaskID);
  }, [taskID]);

  useEffect(() => {
    if (!prevTaskID) {
      setPrevTaskID(taskID);
    }
    if (taskIDChanged) {
      setPrevTaskID(taskID);
    }
  }, [taskID]);

  return {taskID, taskIDChanged};
};

export const useFDStatistics = () => {
  const {taskID, taskIDChanged} = useTaskID();
  const [dependenciesFilter, setDependenciesFilter] = useAtom(dependenciesFilterAtom);
  const [pieChartData, setPieChartData] = useAtom(pieChartDataAtom);
  const [pieChartLoading, setPieChartLoading] = useAtom(pieChartLoadingAtom);
  
  const shouldFetch = !pieChartData && !pieChartLoading;

  const { data, loading } = useQuery<getPieChartData, getPieChartDataVariables>(GET_PIE_CHART_DATA, {
    variables: { taskID },
    skip: !taskID || (!taskIDChanged && !shouldFetch),
  });

  useEffect(() => {
    if (data) setPieChartData(data);
  }, [data, setPieChartData]);

  useEffect(() => {
    setPieChartLoading(loading);
  }, [loading, setPieChartLoading]);

  return {
    taskID,
    dependenciesFilter,
    setDependenciesFilter,
    pieChartData,
    pieChartLoading,
  };
};

export const useFDPrimitiveList = () => {
  const {taskID, taskIDChanged} = useTaskID();
  const [defaultData, setDefaultData] = useAtom(defaultDataAtom);
  const [dependenciesFilter, setDependenciesFilter] = useAtom(dependenciesFilterAtom);

  const { data: taskInfo, loading: taskInfoLoading, error: taskInfoError } = useQuery<getTaskInfo, getTaskInfoVariables>(
    GET_TASK_INFO,
    {
      variables: { taskID },
      skip: !taskID
    },
  );

  const primitiveType = PrimitiveType.FD;

  const defaultFilter = {
    withoutKeys: false,
    filterString: '',
    pagination: { limit: 10, offset: 0 },
    orderDirection: OrderDirection.ASC,
  };
  
  const shouldFetch = !defaultData;

  const { data: mainTaskDepsData, loading: depsLoading, error: depsError } = useQuery<GetMainTaskDeps, GetMainTaskDepsVariables>(
    GET_MAIN_TASK_DEPS,
    {
      variables: {
        taskID: taskID,
        filter: primitiveType
          ? {
              ...defaultFilter,
              ...getSortingParams(primitiveType),
            }
          : defaultFilter,
      },
      skip: !taskID || (!taskIDChanged && !shouldFetch),
    }
  );

  useEffect(() => {
    if (mainTaskDepsData) {
      setDefaultData(mainTaskDepsData);
    }
  }, [mainTaskDepsData, setDefaultData]);

  return {
    taskInfo,
    taskID,
    defaultData,
    dependenciesFilter,
  };
};


export const useFDDatasetSnippet = () => {
  const {taskID, taskIDChanged} = useTaskID();
  const [selectedDependency] = useAtom(selectedDependencyAtom);
  const [dataset, setDataset] = useAtom(datasetAtom);

  const shouldFetch = !dataset;

  const { data } = useQuery<getDataset, getDatasetVariables>(GET_DATASET, {
    variables: {
      taskID: taskID,
      pagination: {
        offset: 0,
        limit: DEFAULT_LIMIT,
      },
    },
    skip: !taskID || (!taskIDChanged && !shouldFetch),
  });

  useEffect(() => {
    if (data) setDataset(data);
  }, [data, setDataset]);

  return {
    taskID,
    selectedDependency,
    dataset,
  };
};

export const useDependencyList = () => {
  const {taskID, taskIDChanged} = useTaskID();
  const [dependenciesFilter, setDependenciesFilter] = useAtom(dependenciesFilterAtom);
  const [selectedDependency, setSelectedDependency] = useAtom(selectedDependencyAtom);
  const [errorDependency, setErrorDependency] = useAtom(errorDependencyAtom);
  const [specificTaskID, setSpecificTaskID] = useAtom(specificTaskIDAtom);

  const { showError } = useErrorContext();

  const { data: taskInfo } = useQuery<getTaskInfo, getTaskInfoVariables>(GET_TASK_INFO, {
    variables: { taskID },
    skip: !taskID || !taskIDChanged,
  });

  const { miningCompleted, data: clusterPreviewData, loading: clusterPreviewLoading } = useClustersPreview(specificTaskID, 1);

  const [createSpecificTask, { data: clusterTaskResponse }] = useMutation<createSpecificTask, createSpecificTaskVariables>(CREATE_SPECIFIC_TASK);

  const clusterIsBeingProcessed = clusterPreviewLoading || (!!clusterPreviewData && !miningCompleted);

  const selectDependency = (newDependency: GeneralColumn[]) => {
    if (clusterIsBeingProcessed) {
      showError({ message: 'Another discovering task is in progress' });
      setErrorDependency(newDependency);
    } else {
      setSelectedDependency(newDependency);

      if (taskInfo?.taskInfo.data.baseConfig.type === PrimitiveType.TypoFD) {
        createSpecificTask({
          variables: {
            props: {
              algorithmName: 'Typo Miner',
              type: SpecificTaskType.TypoCluster,
              parentTaskID: taskID,
              typoFD: newDependency.map((e) => e.column.index),
            },
          },
        });
      }
    }
  };

  useEffect(() => {
    if (clusterTaskResponse) {
      setSpecificTaskID(clusterTaskResponse.createSpecificTask.taskID);
    }
  }, [clusterTaskResponse, setSpecificTaskID]);

  useEffect(() => {
    if (errorDependency.length > 0) {
      setTimeout(() => setErrorDependency([]), 5000);
    }
  }, [errorDependency, setErrorDependency]);

  return {
    errorDependency,
    selectedDependency,
    selectDependency,
  };
};
