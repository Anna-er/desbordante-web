import classNames from 'classnames';
import React, { FC, PropsWithChildren } from 'react';
import Background from '@assets/backgrounds/reports.svg?component';
import useTaskState from '@hooks/useTaskState';
import { PrimitiveType } from 'types/globalTypes';
import styles from './ReportsLayout.module.scss';
import { useReportsRouter } from '@components/useReportsRouter';
import reportsConfig from '../../primitives/reportsConfig';



interface Props extends PropsWithChildren {
  pageClass?: string;
  containerClass?: string;
}


export const ReportsLayout: FC<Props> = ({
  pageClass,
  containerClass,
  children,
}) => {
  const { taskID, currentTab, switchTab } = useReportsRouter();
  const { data } = useTaskState();
  const type = data.type as PrimitiveType;

  pageClass = (currentTab == 'snippet') ? pageClass : undefined;
  containerClass = (currentTab == 'snippet') ? containerClass : undefined;
  return (
    <div className={classNames(styles.page, pageClass)}>
      <Background
        className={styles.background}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
      />
      <div className={styles.menu}>
        <ul>
          {type &&
            reportsConfig[type].tabs.map(({ icon, label, pathName }) => (
              <li
                key={pathName}
                className={classNames(
                  currentTab === pathName && styles.active
                )}
                onClick={() => switchTab(pathName)}
              >
                {icon}
                <p>{label}</p>
              </li>
            ))}
        </ul>
      </div>
      <div className={classNames(styles.content, containerClass)}>
        {children}
      </div>
    </div>
  );
};
