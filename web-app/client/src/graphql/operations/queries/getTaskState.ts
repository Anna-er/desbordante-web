import { gql } from '@apollo/client';
import { BASE_CONFIG, TASK_STATE } from '@graphql/operations/fragments';

export const GET_TASK_STATE = gql`
  ${BASE_CONFIG}
  ${TASK_STATE}
  query getTaskState($taskID: ID!) {
    taskInfo(taskID: $taskID) {
      data {
        baseConfig {
          ...BaseConfig
        }
      }
      state {
        ... on TaskState {
          ...TaskState
        }
        ... on BaseTaskError {
          errorStatus
          ... on ResourceLimitTaskError {
            resourceLimitError
          }
          ... on InternalServerTaskError {
            internalError
          }
        }
      }
    }
  }
`;
