import { atom, useAtom } from 'jotai';
import { useQuery, useMutation } from '@apollo/client';
import { useEffect } from 'react';
import { GET_TASK_INFO } from '@graphql/operations/queries/getTaskInfo';
import {
  getTaskInfo,
  getTaskInfoVariables,
} from '@graphql/operations/queries/__generated__/getTaskInfo';
import { CREATE_SPECIFIC_TASK } from '@graphql/operations/mutations/createSpecificTask';
import {
  createSpecificTask,
  createSpecificTaskVariables,
} from '@graphql/operations/mutations/__generated__/createSpecificTask';
import { GeneralColumn } from '@utils/convertDependencies';
import { useErrorContext } from '@hooks/useErrorContext';
import useClustersPreview from '@hooks/useClustersPreview';
import { PrimitiveType, SpecificTaskType } from 'types/globalTypes';
import { useTaskID } from './useTaskID';
import {
  dependenciesFilterAtom,
  selectedDependencyAtom,
  errorDependencyAtom,
  specificTaskIDAtom,
} from '../store';

export const useDependencyList = () => {
  const { taskID, taskIDChanged } = useTaskID();
  const [dependenciesFilter, setDependenciesFilter] = useAtom(
    dependenciesFilterAtom,
  );
  const [selectedDependency, setSelectedDependency] = useAtom(
    selectedDependencyAtom,
  );
  const [errorDependency, setErrorDependency] = useAtom(errorDependencyAtom);
  const [specificTaskID, setSpecificTaskID] = useAtom(specificTaskIDAtom);

  const { showError } = useErrorContext();

  const { data: taskInfo } = useQuery<getTaskInfo, getTaskInfoVariables>(
    GET_TASK_INFO,
    {
      variables: { taskID },
      skip: !taskID || !taskIDChanged,
    },
  );

  const {
    miningCompleted,
    data: clusterPreviewData,
    loading: clusterPreviewLoading,
  } = useClustersPreview(specificTaskID, 1);

  const [createSpecificTask, { data: clusterTaskResponse }] = useMutation<
    createSpecificTask,
    createSpecificTaskVariables
  >(CREATE_SPECIFIC_TASK);

  const clusterIsBeingProcessed =
    clusterPreviewLoading || (!!clusterPreviewData && !miningCompleted);

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
