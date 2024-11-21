import { ComponentType } from 'react';
import ChartIcon from '@assets/icons/chart.svg?component';
import ClusterIcon from '@assets/icons/cluster.svg?component';
import DatatableIcon from '@assets/icons/datatable.svg?component';
import DropDownIcon from '@assets/icons/list-dropdown.svg?component';
import dynamic from 'next/dynamic';

const MFDClustersComponent = dynamic(
  () => import('../../MFD/tabs/menuMFDClusters'),
  {
    ssr: false,
  },
);

import { TabConfig } from '../../reportsConfig';

import React, { FC } from 'react';

const menuMFDClusters: TabConfig = {
  pathName: 'clusters',
  label: 'Clusters',
  icon: <ClusterIcon />,
  component: MFDClustersComponent,
};

export const MFDtabs: TabConfig[] = [menuMFDClusters];
