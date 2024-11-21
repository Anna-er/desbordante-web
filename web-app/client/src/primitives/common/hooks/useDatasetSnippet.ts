import { atom, useAtom } from 'jotai';
import { useQuery, useMutation } from '@apollo/client';
import { useCallback, useEffect } from 'react';
import {
  getDataset,
  getDatasetVariables,
} from '@graphql/operations/queries/__generated__/getDataset';
import { GET_DATASET } from '@graphql/operations/queries/getDataset';
import { useTaskID } from './useTaskID';
import {
  selectedDependencyAtom,
  datasetAtom,
} from '../store';

const DEFAULT_LIMIT = 30;

export const useDatasetSnippet = () => {
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
      skip: !taskID || !shouldFetch,
    });
  
    useEffect(() => {
      if (data) setDataset(data);
    }, [data, setDataset]);
  
    return {
      selectedDependency,
      dataset,
    };
  };