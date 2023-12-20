import { useRouter } from 'next/router';
import { TaskContextProvider, useTaskContext } from '@components/TaskContext';
import dynamic from 'next/dynamic';
import { ReportsLayout } from '@components/ReportsLayout/ReportsLayout';
import styles from '@styles/Snippet.module.scss';
import { useReportsRouter } from '@components/useReportsRouter';

import reportsConfig from '../../../primitives/reportsConfig';
export default function Page() {
  const { taskID, currentTab, switchTab } = useReportsRouter();


  const selectedTab = reportsConfig.FD.tabs.find(tab => currentTab === tab.pathName) || reportsConfig.FD.tabs[0];

  if (selectedTab) {
    return <TaskContextProvider><ReportsLayout pageClass={styles.page} containerClass={styles.container}>
    <selectedTab.component />
  </ReportsLayout></TaskContextProvider>;
  }

}
