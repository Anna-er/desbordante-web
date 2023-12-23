import ChartIcon from '@assets/icons/chart.svg?component';
import DatatableIcon from '@assets/icons/datatable.svg?component';
import DropDownIcon from '@assets/icons/list-dropdown.svg?component';
import dynamic from 'next/dynamic';

const DatasetSnippetComponent = dynamic(() => import('../../CFD/tabs/menuDatasetSnippet'), {
  ssr: false,
});
const InstanceListComponent = dynamic(() => import('../../CFD/tabs/menuInstanceList'), {
  ssr: false,
});
const StatisticsComponent = dynamic(() => import('../../CFD/tabs/menuStatistics'), {
  ssr: false,
});


import { TabConfig } from '../../reportsConfig';

import React from 'react';

const menuStatistics: TabConfig = {
  pathName: 'charts',
  label: 'Statistics',
  icon: <ChartIcon />,
  component: StatisticsComponent,
};
const menuInstanceList: TabConfig = {
  pathName: 'dependencies',
  label: 'Instance list',
  icon: <DropDownIcon />,
  component: InstanceListComponent,
};
const menuDatasetSnippet: TabConfig = {
  pathName: 'snippet',
  label: 'Dataset snippet',
  icon: <DatatableIcon />,
  component: DatasetSnippetComponent,
};

export const CFDtabs: TabConfig[] = [menuStatistics, menuInstanceList, menuDatasetSnippet];