import { PrimitiveType } from 'types/globalTypes';
import { FDtabs } from './FD';

import { ComponentType } from 'react';

import {FC, ReactElement} from "react";

  
  

export type TabConfig = {
  pathName: string;
  label: string;
  icon: ReactElement;
  component: ComponentType<any>;
};
  

type PrimitiveReportConfig = {
  store: any;
  tabs: TabConfig[];
}

type ReportConfig = Record<PrimitiveType, PrimitiveReportConfig>;



const reportsConfig: ReportConfig = {
    FD: {
      store: "щишка",
      tabs: FDtabs
    },
    AR: {
      store: "any",
      tabs: FDtabs
    },
    CFD: {
      store: "any",
      tabs: FDtabs
    },
    MFD: {
      store: "any",
      tabs: FDtabs
    },
    TypoFD: {
      store: "any",
      tabs: FDtabs
    },
    Stats: {
      store: "any",
      tabs: FDtabs
    },
    TypoCluster: {
      store: "any",
      tabs: FDtabs
    }
}
export default reportsConfig;
