import { PrimitiveType } from 'types/globalTypes';
import { FDtabs } from './FD';
import { MFDtabs } from './MFD';
import { CFDtabs } from './CFD';
import { ARtabs } from './AR';
import { TypoFDtabs } from './TypoFD';

import { ComponentType } from 'react';

import { ReactElement } from 'react';

export type TabConfig = {
  pathName: string;
  label: string;
  icon: ReactElement;
  component: ComponentType;
};

type PrimitiveReportConfig = {
  tabs: TabConfig[];
};

type ReportConfig = Record<PrimitiveType, PrimitiveReportConfig>;

const reportsConfig: ReportConfig = {
  FD: {
    tabs: FDtabs,
  },
  AR: {
    tabs: ARtabs,
  },
  CFD: {
    tabs: CFDtabs,
  },
  MFD: {
    tabs: MFDtabs,
  },
  TypoFD: {
    tabs: TypoFDtabs,
  },
  Stats: {
    tabs: [],
  },
  TypoCluster: {
    tabs: [],
  },
};
export default reportsConfig;
