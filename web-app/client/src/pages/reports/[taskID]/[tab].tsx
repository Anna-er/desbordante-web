import { useRouter } from 'next/router';
import { PrimitiveType } from 'types/globalTypes';
import { ComponentType } from 'react';
import ChartIcon from '@assets/icons/chart.svg?component';
import ClusterIcon from '@assets/icons/cluster.svg?component';
import DatatableIcon from '@assets/icons/datatable.svg?component';
import DropDownIcon from '@assets/icons/list-dropdown.svg?component';
import { TaskContextProvider, useTaskContext } from '@components/TaskContext';
import dynamic from 'next/dynamic';
import { ReportsLayout } from '@components/ReportsLayout/ReportsLayout';
import styles from '@styles/Snippet.module.scss';

const DatasetSnippetComponent = dynamic(() => import('../../../primitives/FD/tabs/menuDatasetSnippet'), {
    ssr: false,
});
const PrimitiveListComponent = dynamic(() => import('../../../primitives/FD/tabs/menuPrimitiveList'), {
    ssr: false,
});
const StatisticsComponent = dynamic(() => import('../../../primitives/FD/tabs/menuStatistics'), {
    ssr: false,
});

import {
  getDataset_taskInfo_dataset_snippet,
} from '@graphql/operations/queries/__generated__/getDataset';import {FC, ReactElement} from "react";
import {
  GetMainTaskDeps,
} from '@graphql/operations/queries/__generated__/GetMainTaskDeps';

interface pageProps{
  params: {taskID: string}
}
type Snippet = getDataset_taskInfo_dataset_snippet;

type DefaultDataProps = {
  defaultData?: GetMainTaskDeps;
};

type SnippetProps = {
  snippet: Snippet;
};

type PropsTab = any;


type TabConfig = {
  pathName: string;
  label: string;
  icon: ReactElement;
  component: ComponentType<PropsTab>;
}
// const StatisticsComponent: FC = () => {
//   return <p>ITS STATISTICS</p>;
// };
// const PrimitiveListComponent: FC = () => {
//   return <p>ITS PRIMITIVE LIST</p>;
// };
// const DatasetSnippetComponent: FC = () => {
//   return <p>ITS DATASET SNIPPET</p>;
// };

const menuStatistics: TabConfig = {
  pathName: 'charts',
  label: 'Statistics',
  icon: <ChartIcon />,
  component: StatisticsComponent,
};
const menuPrimitiveList: TabConfig = {
  pathName: 'dependencies',
  label: 'Primitive list',
  icon: <DropDownIcon />,
  component: PrimitiveListComponent,
};
const menuDatasetSnippet: TabConfig = {
  pathName: 'snippet',
  label: 'Dataset snippet',
  icon: <DatatableIcon />,
  component: DatasetSnippetComponent,
};

type PrimitiveReportConfig = {
  store: any;
  tabs: TabConfig[];
}

type ReportConfig = Record<PrimitiveType, PrimitiveReportConfig>;

const reportsConfig: ReportConfig = {
  FD: {
    store: "any",
    tabs: [menuStatistics, menuPrimitiveList, menuDatasetSnippet]
  },
  AR: {
    store: "any",
    tabs: [menuStatistics, menuPrimitiveList, menuDatasetSnippet]
  },
  CFD: {
    store: "any",
    tabs: [menuStatistics, menuPrimitiveList, menuDatasetSnippet]
  },
  MFD: {
    store: "any",
    tabs: [menuStatistics, menuPrimitiveList, menuDatasetSnippet]
  },
  TypoFD: {
    store: "any",
    tabs: [menuStatistics, menuPrimitiveList, menuDatasetSnippet]
  },
  Stats: {
    store: "any",
    tabs: [menuStatistics, menuPrimitiveList, menuDatasetSnippet]  
  },
  TypoCluster: {
    store: "any",
    tabs: [menuStatistics, menuPrimitiveList, menuDatasetSnippet]  
  }
}
export default function Page() {
  const router = useRouter();


  const selectedTab = reportsConfig.FD.tabs.find(tab => router.query.tab === tab.pathName);

  if (selectedTab) {
    const taskID = router.query.taskID;
    const currentTab = router.query.tab;
    console.log("taskID=",taskID, "currentTab=",currentTab);
    return <TaskContextProvider>  <ReportsLayout pageClass={styles.page} containerClass={styles.container}>
    <selectedTab.component />
  </ReportsLayout></TaskContextProvider>;
  }

  return null; // Вернуть что-то другое, если нет соответствующего компонента
}
