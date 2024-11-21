import LayeredChart from '@components/Chart/LayeredChart';
import { useFDStatistics } from '../hooks/useFDStatistics';
import { getPieChartData } from '@graphql/operations/queries/__generated__/getPieChartData';
import styles from '@styles/Charts.module.scss';
import { NextPageWithLayout } from 'types/pageWithLayout';

const getChartData = (data?: getPieChartData) => {
  if (
    data &&
    'pieChartData' in data.taskInfo.data &&
    data.taskInfo.data.pieChartData
  ) {
    const pieData = data.taskInfo.data.pieChartData;
    if ('FD' in pieData) return pieData.FD.withoutPatterns;
    if ('CFD' in pieData) return pieData.CFD.withoutPatterns;
  }
  return { lhs: [], rhs: [] };
};

const ReportsCharts: NextPageWithLayout = () => {
  const {
    dependenciesFilter,
    setDependenciesFilter,
    pieChartData: data,
    pieChartLoading: loading,
  } = useFDStatistics();

  const { lhs, rhs } = getChartData(data);

  return (
    <div className={styles.container}>
      {loading && <h5>Loading..</h5>}
      {loading == false && (
        <>
          <LayeredChart
            title="Left-hand side"
            attributes={lhs}
            {...{
              selectedAttributeIndices: dependenciesFilter.lhs,
              setSelectedAttributeIndices: (lhs) =>
                setDependenciesFilter(({ rhs }) => ({ rhs, lhs })),
            }}
          />
          <LayeredChart
            title="Right-hand side"
            attributes={rhs}
            {...{
              selectedAttributeIndices: dependenciesFilter.rhs,
              setSelectedAttributeIndices: (rhs) =>
                setDependenciesFilter(({ lhs }) => ({ rhs, lhs })),
            }}
          />
        </>
      )}
    </div>
  );
};

export default ReportsCharts;
