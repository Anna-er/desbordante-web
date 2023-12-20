import { ComponentType } from 'react';
import ChartIcon from '@assets/icons/chart.svg?component';
import ClusterIcon from '@assets/icons/cluster.svg?component';
import DatatableIcon from '@assets/icons/datatable.svg?component';
import DropDownIcon from '@assets/icons/list-dropdown.svg?component';
import dynamic from 'next/dynamic';

const DatasetSnippetComponent = dynamic(() => import('../../../primitives/FD/tabs/menuDatasetSnippet'), {
  ssr: false,
});
const PrimitiveListComponent = dynamic(() => import('../../../primitives/FD/tabs/menuPrimitiveList'), {
  ssr: false,
});
const StatisticsComponent = dynamic(() => import('../../../primitives/FD/tabs/menuStatistics'), {
  ssr: false,
});
import { TabConfig } from '../../reportsConfig';

import React, { FC } from 'react';

// const MyComponent: FC = () => {
//   return (
//     <div>
//       <h1>Hello, World!</h1>
//       <p>This is a functional component without props.</p>
//     </div>
//   );
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

export const FDtabs: TabConfig[] = [menuStatistics, menuPrimitiveList, menuDatasetSnippet];