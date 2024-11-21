import {useAtom} from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
import useMFDTask from '@hooks/useMFDTask';
import useMFDHighlight from '@hooks/useMFDHighlight';
import {
   clusterIndexAtom,
   limitAtom,
   parameterAtom,
   orderDirectionAtom,
   isInsertedAtom,
   furthestIndexAtom,
   rowIndexAtom,
   furthestDataAtom,
   isOrderingShownAtom,
   showFullValueAtom,
} from '../store';


export const useMenuMFDClusters = (taskID: string) => {
  const defaultOffsetDifference = 50;

  const [clusterIndex, setClusterIndex] = useAtom(clusterIndexAtom);
  const [limit, setLimit] = useAtom(limitAtom);
  const [parameter, setOrderingParameter] = useAtom(parameterAtom);
  const [orderDirection, setOrderDirection] = useAtom(orderDirectionAtom);
  const [isInserted, setIsInserted] = useAtom(isInsertedAtom);
  const [furthestIndex, setFurthestIndex] = useAtom(furthestIndexAtom);
  const [rowIndex, setRowIndex] = useAtom(rowIndexAtom);
  const [furthestData, setFurthestData] = useAtom(furthestDataAtom);
  const [isOrderingShown, setIsOrderingShown] = useAtom(isOrderingShownAtom);
  const [showFullValue, setShowFullValue] = useAtom(showFullValueAtom);

  const shouldIgnoreScrollEvent = useRef(false);

  const { data, loading, error } = useMFDTask(taskID, clusterIndex, limit, parameter, orderDirection);

  const [loadMFDHighlight, { data: highlightData }] = useMFDHighlight();

  useEffect(() => {
    if (!loading && !error && data) {
      shouldIgnoreScrollEvent.current = false;
    }
  }, [data, error, loading]);

  useEffect(() => {
    if (isInserted) {
      if (
        highlightData &&
        highlightData.taskInfo &&
        highlightData.taskInfo.data.__typename === 'TaskWithDepsData' &&
        highlightData.taskInfo.data.result &&
        highlightData.taskInfo.data.result.__typename === 'MFDTaskResult'
      ) {
        const highlight = highlightData.taskInfo.data.result.filteredDeps.deps[0];

        setFurthestData({
          position: rowIndex,
          data: {
            index: highlight.index,
            rowIndex: highlightData.taskInfo.data.result.depsAmount + 1,
            withinLimit: highlight.withinLimit,
            maximumDistance: highlight.maximumDistance,
            furthestPointIndex: highlight.furthestPointIndex,
            value: highlight.value,
            clusterValue: highlight.clusterValue,
          },
        });
      } else {
        setFurthestData(undefined);
      }
    } else {
      setFurthestData(undefined);
    }
  }, [isInserted, highlightData, rowIndex]);

  const insertRow = useCallback(
    (furthestIndex: number, rowIndex: number) => {
      setFurthestIndex(furthestIndex);
      setRowIndex(rowIndex);
      setIsInserted(true);
      loadMFDHighlight({
        variables: {
          taskID,
          clusterIndex,
          rowFilter: `index=${furthestIndex}`,
        },
      });
    },
    [loadMFDHighlight, taskID, clusterIndex]
  );

  const closeInsertedRow = useCallback(() => {
    setIsInserted(false);
    setFurthestData(undefined);
  }, []);

  const onScroll = useCallback(
    (direction: string) => {
      if (!shouldIgnoreScrollEvent.current && direction === 'down') {
        shouldIgnoreScrollEvent.current = true;
        if (limit < (data?.cluster.highlightsTotalCount || 0)) {
          setLimit((l) => l + defaultOffsetDifference);
        } else {
          shouldIgnoreScrollEvent.current = false;
        }
      }
    },
    [data?.cluster.highlightsTotalCount, limit]
  );

  return {
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
  };
};
