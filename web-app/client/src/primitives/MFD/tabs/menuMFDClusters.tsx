import _ from 'lodash';
import { useReportsRouter } from '@components/useReportsRouter';
import React, { FC, ReactNode } from 'react';
import { useForm } from 'react-hook-form';

import EyeIcon from '@assets/icons/eye.svg?component';
import ArrowCrossed from '@assets/icons/line-arrow-right-crossed.svg?component';
import Arrow from '@assets/icons/line-arrow-right.svg?component';
import OrderingIcon from '@assets/icons/ordering.svg?component';
import Button from '@components/Button';

import { ControlledSelect } from '@components/Inputs/Select';
import ListPropertiesModal from '@components/ListPropertiesModal';
import Pagination from '@components/Pagination/Pagination';

import { MFDTable } from '@components/ScrollableNodeTable/implementations/MFDTable';
import styles from '@styles/MetricDependencies.module.scss';

import { MFDOrderingParameter, OrderDirection } from 'types/globalTypes';

import { NextPageWithLayout } from 'types/pageWithLayout';
import { useMenuMFDClusters } from '../hooks/useMenuMFDClusters';

const ReportsMFD: NextPageWithLayout = () => {
  const { taskID } = useReportsRouter();

  const {
    data,
    clusterIndex,
    setClusterIndex,
    isOrderingShown,
    setIsOrderingShown,
    showFullValue,
    setShowFullValue,
    setOrderingParameter,
    orderDirection,
    setOrderDirection,
    furthestData,
    insertRow,
    closeInsertedRow,
    onScroll,
  } = useMenuMFDClusters(taskID);

  return (
    <>
      {isOrderingShown && (
        <OrderingWindow
          setIsOrderingShown={setIsOrderingShown}
          setOrderingParameter={setOrderingParameter}
          setOrderDirection={setOrderDirection}
        />
      )}
      {data.result === undefined && <ReportFiller title={'Loading'} />}
      {data.result !== undefined && (
        <>
          {!data.clustersTotalCount && data.result && (
            <ReportFiller
              title={
                'No clusters have been discovered (metric dependency holds)'
              }
              description={'Try restarting the task with different parameters'}
              icon={<Arrow />}
            />
          )}
          {!data.clustersTotalCount && !data.result && (
            <ReportFiller
              title={
                'No clusters have been discovered (metric dependency may not hold)'
              }
              description={'Try restarting the task with different parameters'}
              icon={<ArrowCrossed />}
            />
          )}
          {data.clustersTotalCount !== 0 && !data.result && (
            <div className={styles.clustersContainer}>
              <h5>Clusters</h5>

              <div className={styles.filters}>
                <div className={styles.buttons}>
                  <Button
                    variant="secondary"
                    size="md"
                    icon={<OrderingIcon />}
                    onClick={() => setIsOrderingShown(true)}
                  >
                    Ordering
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    icon={<EyeIcon />}
                    onClick={() => setShowFullValue((e) => !e)}
                  >
                    {showFullValue ? 'Hide' : 'Show'} full value
                  </Button>
                </div>
              </div>

              <h6>Cluster value: {data.cluster.value || 'loading'}</h6>

              <MFDTable
                clusterNumber={clusterIndex}
                totalCount={data.clustersTotalCount}
                highlights={data.cluster.highlights}
                onScroll={onScroll}
                isFullValueShown={showFullValue}
                insertedRow={furthestData}
                insertRow={insertRow}
                closeInsertedRow={closeInsertedRow}
                className={styles.table}
              />

              {data.clustersTotalCount && (
                <Pagination
                  count={data.clustersTotalCount}
                  current={clusterIndex + 1}
                  onChange={(page) => {
                    setClusterIndex(page - 1);
                  }}
                />
              )}
            </div>
          )}
        </>
      )}
    </>
  );
};

type ReportFillerProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
};

const ReportFiller: FC<ReportFillerProps> = ({ title, description, icon }) => {
  return (
    <div className={styles.container}>
      <div className={styles.filler}>
        {icon && <div className={styles.icon}>{icon}</div>}
        <div className={styles.text}>
          <h6>{title}</h6>
          {description && <p>{description}</p>}
        </div>
      </div>
    </div>
  );
};

type OrderingProps = {
  setIsOrderingShown: (arg: boolean) => void;
  setOrderingParameter: (arg: MFDOrderingParameter) => void;
  setOrderDirection: (arg: OrderDirection) => void;
};

type SortingProps = {
  sorting: MFDOrderingParameter;
  ordering: OrderDirection;
};

const OrderingWindow: FC<OrderingProps> = ({
  setIsOrderingShown,
  setOrderingParameter,
  setOrderDirection,
}) => {
  const sortingOptions = [
    { value: MFDOrderingParameter.POINT_INDEX, label: 'Point index' },
    {
      value: MFDOrderingParameter.FURTHEST_POINT_INDEX,
      label: 'Furthest point index',
    },
    { value: MFDOrderingParameter.MAXIMUM_DISTANCE, label: 'Maximum distance' },
  ];

  const orderingOptions = {
    [OrderDirection.ASC]: { value: OrderDirection.ASC, label: 'Ascending' },
    [OrderDirection.DESC]: { value: OrderDirection.DESC, label: 'Descending' },
  };

  const { control, watch, reset } = useForm<SortingProps>({
    defaultValues: {
      sorting: MFDOrderingParameter.MAXIMUM_DISTANCE,
      ordering: OrderDirection.ASC,
    },
  });

  const { sorting, ordering } = watch();

  // TODO: Fix "value.match..." error when changing form parameter (this error is present on deployed version, btw)
  return (
    <ListPropertiesModal
      name="Ordering"
      onClose={() => {
        reset();
        setIsOrderingShown(false);
      }}
      onApply={() => {
        setOrderingParameter(sorting);
        setOrderDirection(ordering);
        setIsOrderingShown(false);
      }}
    >
      <ControlledSelect
        control={control}
        controlName="sorting"
        label="Sort by"
        options={_.values(sortingOptions)}
      />
      <ControlledSelect
        control={control}
        controlName="ordering"
        label="Direction"
        options={_.values(orderingOptions)}
      />
    </ListPropertiesModal>
  );
};

export default ReportsMFD;
