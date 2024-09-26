import cn from 'classnames';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { FC, useEffect } from 'react';
import useTaskState from '@hooks/useTaskState';
import getTaskStatusData from '@utils/getTaskStatusData';
import { PrimitiveType } from 'types/globalTypes';
import styles from './Loader.module.scss';
import reportsConfig from '../../primitives/reportsConfig';

const Loader: FC = () => {
  const router = useRouter();
  const { data, error } = useTaskState();
  const status = getTaskStatusData(error, data.state);
  
  useEffect(() => {
    const { state, type } = data;

    if (
      state &&
      'processStatus' in state &&
      state.processStatus === 'COMPLETED' &&
      type !== ''
    ) {
      setTimeout(() => {
        const pathName = reportsConfig[type as PrimitiveType]?.tabs[0].pathName;
        void router.push({
          pathname: `/reports/${data.taskID}/${pathName}`,
        });
      }, 500);
    }
  }, [data, router]);

  const icon = status.isAnimated ? (
    <video
      autoPlay
      muted
      loop
      width={70}
      height={76}
      data-testid="animated-icon"
    >
      <source src={status.icon} type="video/webm" />
    </video>
  ) : (
    <Image src={status.icon} alt="status" width={70} height={76} />
  );
  return (
    <div className={styles.container}>
      {icon}
      <div className={styles.text}>
        <h6>
          Task status:
          <span className={cn(styles[status.className], styles.status)}>
            {' '}
            {status.label}
          </span>
        </h6>
        <p className={styles.description}>{status.description}</p>
      </div>
    </div>
  );
};
export default Loader;
