import { useRouter } from 'next/router';

export const useReportsRouter = () => {
  const router = useRouter();
  const taskID = router.query.taskID as string;
  const currentTab = router.query.tab as string;

  const switchTab = (tab: string) => {
    router.push({
      pathname: router.pathname.replace(currentTab, tab),
      query: { ...router.query, tab},
    });
  };

  return { taskID, currentTab, switchTab };
};