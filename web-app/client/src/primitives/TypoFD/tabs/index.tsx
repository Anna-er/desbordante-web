import ClusterIcon from '@assets/icons/cluster.svg?component';
import DatatableIcon from '@assets/icons/datatable.svg?component';
import DropDownIcon from '@assets/icons/list-dropdown.svg?component';
import dynamic from 'next/dynamic';

const DatasetSnippetComponent = dynamic(() => import('../../common/menuDatasetSnippet'), {
  ssr: false,
});
const InstanceListComponent = dynamic(() => import('../../common/menuInstanceList'), {
  ssr: false,
});
const ClustersComponent = dynamic(() => import('../../TypoFD/tabs/menuClusters'), {
  ssr: false,
});


import { TabConfig } from '../../reportsConfig';

import React from 'react';

const menuClusters: TabConfig = {
  pathName: 'clusters',
  label: 'Clusters',
  icon: <ClusterIcon />,
  component: ClustersComponent,
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

export const TypoFDtabs: TabConfig[] = [menuInstanceList, menuClusters, menuDatasetSnippet];