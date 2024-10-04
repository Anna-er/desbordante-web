import { atom, useAtom } from 'jotai';
import { useQuery, useMutation } from '@apollo/client';
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
import { set } from 'date-fns';

const DEFAULT_LIMIT = 30;

type DependencyFilter = { rhs: number[]; lhs: number[] };

export const taskIDAtom = atom<string>(() => {
  const { taskID } = useReportsRouter();
  return taskID;
});

export const defaultDataAtom = atom<GetMainTaskDeps | undefined>(undefined);
export const dependenciesFilterAtom = atom<DependencyFilter>({ rhs: [], lhs: [] });
export const selectedDependencyAtom = atom<GeneralColumn[]>([]);
export const errorDependencyAtom = atom<GeneralColumn[]>([]);
export const specificTaskIDAtom = atom<string | undefined>(undefined);
export const datasetAtom = atom<getDataset | undefined>(undefined);


export const taskInfoAtom = atom((get) => {
  const taskID = get(taskIDAtom);
  if (!taskID) return null;

  const { data } = useQuery<getTaskInfo, getTaskInfoVariables>(GET_TASK_INFO, {
    variables: { taskID },
  });

  return data ? data.taskInfo : null;
});

export const useFDStatistics = () => {
  const [taskID, setTaskID] = useAtom(taskIDAtom);
  const [dependenciesFilter, setDependenciesFilter] = useAtom(dependenciesFilterAtom);
  
  const { data: pieChartData, loading: pieChartLoading, error: pieChartError } = useQuery<getPieChartData, getPieChartDataVariables>(
    GET_PIE_CHART_DATA,
    { variables: { taskID } }
  );


  return {
    taskID,
    dependenciesFilter,
    setDependenciesFilter,
    pieChartData,
    pieChartLoading,
  };
};



export const useFDPrimitiveList = () => {
  // const [defaultData, setDefaultData] = useAtom(defaultDataAtom);
  const [taskID, setTaskID] = useAtom(taskIDAtom);
  const [defaultData, setDefaultData] = useAtom(defaultDataAtom);
  const [dependenciesFilter, setDependenciesFilter] = useAtom(dependenciesFilterAtom);

  const { data: taskInfo, loading: taskInfoLoading, error: taskInfoError } = useQuery<getTaskInfo, getTaskInfoVariables>(
    GET_TASK_INFO,
    {
      variables: { taskID },
    },
  );

  const primitiveType = taskInfo?.taskInfo.data.baseConfig.type;

  if (primitiveType) {
    const sortingParams = getSortingParams(primitiveType);

    const { data } = useQuery<GetMainTaskDeps>(GET_MAIN_TASK_DEPS, {
      variables: {
        taskID,
        filter: {
          withoutKeys: false,
          filterString: '',
          pagination: { limit: 10, offset: 0 },
          ...sortingParams,
          orderDirection: OrderDirection.ASC,
        },
      },
    });

    setDefaultData(data);
  }


  return {
    taskInfo,
    taskID,
    defaultData,
    dependenciesFilter,
  };
};

export const useFDDatasetSnippet = () => {
  const { taskID: routerTaskID } = useReportsRouter();
  const [taskID, setTaskID] = useAtom(taskIDAtom);
  // const [dataset, setDataset] = useAtom(datasetAtom);
  const [selectedDependency, selectDependency] = useAtom(selectedDependencyAtom);

  const { data: dataset } = useQuery<getDataset, getDatasetVariables>(GET_DATASET, {
    variables: {
      taskID,
      pagination: {
        offset: 0,
        limit: DEFAULT_LIMIT,
      },
    },
  });
  
  // setDataset(data);
  // console.log(data);
  // console.log(dataset);

  return {
    taskID,
    selectedDependency,
    dataset,
  };
};

export const useDependencyList = () => {
  const [taskID, setTaskID] = useAtom(taskIDAtom);
  const [dependenciesFilter, setDependenciesFilter] = useAtom(dependenciesFilterAtom);
  const [selectedDependency, setSelectedDependency] = useAtom(selectedDependencyAtom);
  const [errorDependency, setErrorDependency] = useAtom(errorDependencyAtom);
  const [specificTaskID, setSpecificTaskID] = useAtom(specificTaskIDAtom);

  const { showError } = useErrorContext();

  // Устанавливаем taskID из роутера, если его еще нет
  // if (!taskID && routerTaskID) {
  //   setTaskID(routerTaskID);
  // }

  const { data: taskInfo, loading: taskInfoLoading, error: taskInfoError } = useQuery<getTaskInfo, getTaskInfoVariables>(
    GET_TASK_INFO,
    {
      variables: { taskID },
    },
  );
  
  const { miningCompleted, data: clusterPreviewData, loading: clusterPreviewLoading, error: clusterPreviewError } = useClustersPreview(specificTaskID, 1);

  const [createSpecificTask, { data: clusterTaskResponse, loading: miningTaskLoading }] = useMutation<createSpecificTask, createSpecificTaskVariables>(CREATE_SPECIFIC_TASK);

  const clusterIsBeingProcessed = miningTaskLoading || clusterPreviewLoading || (!!clusterPreviewData && !miningCompleted && !clusterPreviewError);

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

  if (clusterTaskResponse) {
    setSpecificTaskID(clusterTaskResponse.createSpecificTask.taskID);
  }

  if (errorDependency.length > 0) {
    setTimeout(() => setErrorDependency([]), 5000);
  }

  return {
    errorDependency,
    selectedDependency,
    selectDependency
  };
};
