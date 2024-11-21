
import { atom, useAtom } from 'jotai';
import { useQuery, useMutation } from '@apollo/client';
import { useCallback, useEffect } from 'react';
import { GET_TASK_INFO } from '@graphql/operations/queries/getTaskInfo';
import { getTaskInfo, getTaskInfoVariables } from '@graphql/operations/queries/__generated__/getTaskInfo';
import { OrderDirection, PrimitiveType, SpecificTaskType } from 'types/globalTypes';
import { getSortingParams } from '@components/Filters';
import { GET_MAIN_TASK_DEPS } from '@graphql/operations/queries/getDeps';
import {
  GetMainTaskDeps,
  GetMainTaskDepsVariables,
} from '@graphql/operations/queries/__generated__/GetMainTaskDeps';
import { useTaskID } from './useTaskID';
import {
  dependenciesFilterAtom,
  defaultDataAtom,
  taskInfoAtom,
} from '../store';

export const usePrimitiveList = () => {
    const {taskID, taskIDChanged} = useTaskID();
    const [defaultData, setDefaultData] = useAtom(defaultDataAtom);
    const [dependenciesFilter, setDependenciesFilter] = useAtom(dependenciesFilterAtom);
    const [taskInfo, setTaskInfo] = useAtom(taskInfoAtom);
  
    const { data, loading: taskInfoLoading, error: taskInfoError } = useQuery<getTaskInfo, getTaskInfoVariables>(
      GET_TASK_INFO,
      {
        variables: { taskID },
        skip: !taskID || (taskInfo !== undefined),
      },
    );
  
    useEffect(() => {
      if (data) setTaskInfo(data);
    }, [data]);
  
    const primitiveType = taskInfo?.taskInfo.data.baseConfig.type;
  
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
        skip: !taskID || !shouldFetch,
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