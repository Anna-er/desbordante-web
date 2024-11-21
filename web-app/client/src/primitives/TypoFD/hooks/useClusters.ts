import { atom, useAtom } from 'jotai';
import { useQuery, useMutation } from '@apollo/client';
import { useEffect } from 'react';
import { GET_DATASET } from '@graphql/operations/queries/getDataset';
import { CREATE_SPECIFIC_TASK } from '@graphql/operations/mutations/createSpecificTask';
import {
  getDataset,
  getDatasetVariables,
} from '@graphql/operations/queries/__generated__/getDataset';
import {
  createSpecificTask,
  createSpecificTaskVariables,
} from '@graphql/operations/mutations/__generated__/createSpecificTask';
import { GeneralColumn } from '@utils/convertDependencies';
import { useTaskID } from '../../common/hooks/useTaskID';
import { PrimitiveType, SpecificTaskType } from 'types/globalTypes';
import { getClustersPreview } from '@graphql/operations/queries/EDP/__generated__/getClustersPreview';
import {
  selectedDependencyAtom,
  specificTaskIDAtom,
  datasetHeaderAtom,
} from '../store';

export const useClusters = () => {
  const [selectedDependency, setSelectedDependency] = useAtom(
    selectedDependencyAtom,
  );
  const [specificTaskID, setSpecificTaskID] = useAtom(specificTaskIDAtom);
  const [datasetHeader, setDatasetHeader] = useAtom(datasetHeaderAtom);

  const { taskID } = useTaskID(); // Assuming taskID is managed externally

  // Fetch dataset info
  const { data: datasetInfo } = useQuery<getDataset, getDatasetVariables>(
    GET_DATASET,
    {
      variables: { taskID, pagination: { offset: 0, limit: 1 } },
      skip: !taskID,
    },
  );

  // Update dataset header
  useEffect(() => {
    if (datasetInfo?.taskInfo.dataset?.snippet.header) {
      setDatasetHeader(datasetInfo.taskInfo.dataset.snippet.header);
    }
  }, [datasetInfo, setDatasetHeader]);

  const [createSpecificTask] = useMutation<
    createSpecificTask,
    createSpecificTaskVariables
  >(CREATE_SPECIFIC_TASK);

  const getCluster = (response?: getClustersPreview) => {
    if (
      response &&
      'result' in response?.taskInfo.data &&
      response?.taskInfo?.data?.result
    ) {
      return response?.taskInfo.data.result.typoClusters[0];
    }
    return undefined;
  };

  // Handle selected dependency and trigger specific task creation
  useEffect(() => {
    if (selectedDependency.length > 0) {
      createSpecificTask({
        variables: {
          props: {
            algorithmName: 'Typo Miner',
            type: SpecificTaskType.TypoCluster,
            parentTaskID: taskID,
            typoFD: selectedDependency.map((e) => e.column.index),
          },
        },
      }).then((response) => {
        if (response.data?.createSpecificTask.taskID) {
          setSpecificTaskID(response.data.createSpecificTask.taskID);
        }
      });
    }
  }, [selectedDependency, createSpecificTask, taskID, setSpecificTaskID]);

  return {
    selectedDependency,
    setSelectedDependency,
    specificTaskID,
    datasetHeader,
    getCluster,
  };
};
