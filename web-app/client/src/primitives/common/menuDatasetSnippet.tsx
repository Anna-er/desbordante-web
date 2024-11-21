import { useMemo, useRef } from 'react';
import ScrollableTable from '@components/ScrollableTable';
import { useDatasetSnippet } from './hooks/useDatasetSnippet';
import styles from '@styles/Snippet.module.scss';
import { NextPageWithLayout } from 'types/pageWithLayout';


const DEFAULT_LIMIT = 30;
const LIMIT_INCREMENT = 30;

const ReportsSnippet: NextPageWithLayout = () => {

  const { selectedDependency, dataset } = useDatasetSnippet();

  const paginationLimit = useRef(DEFAULT_LIMIT);

  const snippet = dataset?.taskInfo.dataset?.snippet




  const handleScrollToBottom = async () => {
    if (!snippet || paginationLimit.current >= snippet.datasetInfo.rowsCount) {
      return;
    }

    paginationLimit.current += LIMIT_INCREMENT;
    const newRows = dataset?.taskInfo.dataset?.snippet.rows;
  };

  const highlightedColumnIndices = useMemo(
    () => selectedDependency.map((attribute) => attribute.column.index),
    [selectedDependency]
  );

  const pageClass = styles.page;

  const containerClass = styles.content;

  return (
    <><h5 className={styles.header}>Dataset Snippet</h5>
      <ScrollableTable
        className={styles.table}
        header={snippet?.header || []}
        data={snippet?.rows || []}
        highlightColumnIndices={highlightedColumnIndices}
        onScroll={handleScrollToBottom}
      />
    </>
  );
};


export default ReportsSnippet;
