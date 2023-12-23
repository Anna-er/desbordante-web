import { TaskContextProvider } from '@components/TaskContext';
import { ReportsLayout } from '@components/ReportsLayout/ReportsLayout';
import { useReportsRouter } from '@components/useReportsRouter';
import { useQuery } from '@apollo/client';
import {
  getTaskInfo,
  getTaskInfoVariables,
} from '@graphql/operations/queries/__generated__/getTaskInfo';
import { GET_TASK_INFO } from '@graphql/operations/queries/getTaskInfo';
import reportsConfig from '../../../primitives/reportsConfig';
import styles from '@styles/Snippet.module.scss';

export default function Page() {
  const { taskID, currentTab, switchTab } = useReportsRouter();


  const { data: taskInfo } = useQuery<getTaskInfo, getTaskInfoVariables>(
    GET_TASK_INFO,
    {
      variables: { taskID },
    }
  );
  const primitiveType = taskInfo?.taskInfo.data.baseConfig.type;

  if (primitiveType) {
    const selectedTab = reportsConfig[primitiveType].tabs.find(tab => currentTab === tab.pathName) || reportsConfig[primitiveType].tabs[0];
    if (selectedTab) {
      return <TaskContextProvider><ReportsLayout pageClass={styles.page} containerClass={styles.container}>
        <selectedTab.component />
      </ReportsLayout>;</TaskContextProvider>

    }
  }
}
