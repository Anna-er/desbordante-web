import { useRouter } from 'next/router';

export const useReportsRouter = () => {
  const router = useRouter();

  const taskID = router.query.taskID as string | undefined;
  const currentTab = router.query.tab as string | undefined;

  if (!taskID || !currentTab) {
    throw new Error('useReportsRouter must be used within a page where taskID and tab query parameters are available.');
  }

  const switchTab = (tab: string) => {
    router.push({
      pathname: router.pathname.replace(currentTab, tab),
      query: { ...router.query, tab },
    });
  };

  return { taskID, currentTab, switchTab };
};
