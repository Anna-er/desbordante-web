import Image from 'next/image';
import { FC, useState } from 'react';
import longArrowIcon from '@assets/icons/long-arrow.svg';
import Pagination from '@components/Pagination/Pagination';
import ClusterTable from '@components/ScrollableTable/ClusterTable';
import Tooltip from '@components/Tooltip';
import { getClustersPreview } from '@graphql/operations/queries/EDP/__generated__/getClustersPreview';
import useClustersPreview from '@hooks/useClustersPreview';
import styles from '@styles/Clusters.module.scss';
import { NextPageWithLayout } from 'types/pageWithLayout';
import { useClusters } from '../hooks/useClusters';


const ReportsClusters: NextPageWithLayout = () => {
  const { selectedDependency, datasetHeader, specificTaskID, getCluster } = useClusters();
  const [page, setPage] = useState(1);

  const { data, totalCount, previousData, miningCompleted } =
    useClustersPreview(specificTaskID, page);

  const cluster = miningCompleted ? getCluster(data) : getCluster(previousData);
  return (
    <div className={styles.container}>
      {selectedDependency.length > 0 && !miningCompleted && !cluster && (
        <Loader
          lhs={selectedDependency.slice(0, -1).map((e) => e.column.name)}
          rhs={
            selectedDependency.at(selectedDependency.length - 1)!.column.name
          }
        />
      )}{' '}
      {miningCompleted && !cluster && <h6>No clusters were found</h6>}
      {specificTaskID && cluster && (
        <>
          <h5>
            Clusters <Tooltip>Tooltip describing this section</Tooltip>
          </h5>
          <ClusterTable
            key={cluster.clusterID}
            specificTaskID={specificTaskID}
            clusterID={cluster.clusterID}
            data={cluster.items.map((e) => e.row)}
            totalCount={cluster.itemsAmount}
            header={datasetHeader}
          />{' '}
          {totalCount && (
            <Pagination
              count={totalCount}
              current={page}
              onChange={(page) => setPage(page)}
            />
          )}
        </>
      )}
    </div>
  );
};

type LoaderProps = {
  rhs: string;
  lhs: string[];
};
const Loader: FC<LoaderProps> = ({ lhs, rhs }) => {
  return (
    <div className={styles.loader}>
      <video
        autoPlay
        muted
        loop
        width={70}
        height={76}
        data-testid="animated-icon"
      >
        <source src="/logo-animation.webm" type="video/webm" />
      </video>
      <div className={styles.content}>
        <h6>Discovering clusters for dependency</h6>
        <div className={styles.dependency}>
          {lhs.map((attr) => (
            <span className={styles.attr} key={attr}>
              {attr}
            </span>
          ))}
          <Image src={longArrowIcon} width={66} height={15} alt="" />
          <span className={styles.attr}>{rhs}</span>
        </div>
      </div>
    </div>
  );
};


export default ReportsClusters;
