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
import { PrimitiveType, SpecificTaskType } from 'types/globalTypes';

type DependencyFilter = { rhs: number[]; lhs: number[] };

// Атомы для состояния
export const taskIDAtom = atom<string>(() => {
  const { taskID } = useReportsRouter();
  return taskID;
});
export const dependenciesFilterAtom = atom<DependencyFilter>({ rhs: [], lhs: [] });
export const selectedDependencyAtom = atom<GeneralColumn[]>([]);
export const errorDependencyAtom = atom<GeneralColumn[]>([]);
export const specificTaskIDAtom = atom<string | undefined>(undefined);

// Атом для taskInfo с использованием useQuery
export const taskInfoAtom = atom((get) => {
  const taskID = get(taskIDAtom);
  if (!taskID) return null;

  // Используем useQuery для получения taskInfo
  const { data } = useQuery<getTaskInfo, getTaskInfoVariables>(GET_TASK_INFO, {
    variables: { taskID },
  });

  return data ? data.taskInfo : null;
});

// Пример использования атомов и мутаций в пользовательском хуке
export const useFDPrimitiveList = () => {
  const { taskID: routerTaskID } = useReportsRouter();
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

  // Получаем taskInfo через Apollo useQuery
  const { data: taskInfo, loading: taskInfoLoading, error: taskInfoError } = useQuery<getTaskInfo, getTaskInfoVariables>(GET_TASK_INFO, {
    variables: { taskID },
    skip: !taskID, // Пропускаем запрос, если taskID еще нет
  });

  // Получаем данные кластеризации через useClustersPreview
  const { miningCompleted, data: clusterPreviewData, loading: clusterPreviewLoading, error: clusterPreviewError } = useClustersPreview(specificTaskID, 1);

  // Используем мутацию createSpecificTask для создания новой задачи
  const [createSpecificTask, { data: clusterTaskResponse, loading: miningTaskLoading }] = useMutation<createSpecificTask, createSpecificTaskVariables>(CREATE_SPECIFIC_TASK);

  // Обрабатываем зависимость: если задача кластеризации в процессе, блокируем выбор
  const clusterIsBeingProcessed = miningTaskLoading || clusterPreviewLoading || (!!clusterPreviewData && !miningCompleted && !clusterPreviewError);

  const selectDependency = (newDependency: GeneralColumn[]) => {
    if (clusterIsBeingProcessed) {
      showError({ message: 'Another discovering task is in progress' });
      setErrorDependency(newDependency);
    } else {
      setSelectedDependency(newDependency);

      // Если тип задачи TypoFD, запускаем мутацию создания специфичной задачи
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

  // Обрабатываем успешный ответ создания задачи
  if (clusterTaskResponse) {
    setSpecificTaskID(clusterTaskResponse.createSpecificTask.taskID);
  }

  // Авто-сброс ошибок через 5 секунд
  if (errorDependency.length > 0) {
    setTimeout(() => setErrorDependency([]), 5000);
  }

  return {
    taskID,
    dependenciesFilter,
    setDependenciesFilter,
    taskInfo,
    errorDependency,
    selectedDependency,
    selectDependency,
    loading: taskInfoLoading || miningTaskLoading || clusterPreviewLoading,
    error: taskInfoError || clusterPreviewError,
    specificTaskID,
    clusterIsBeingProcessed,
  };
};
