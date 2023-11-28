import dynamic from 'next/dynamic';
const menuDatasetSnippet = dynamic(() => import('./tabs/menuDatasetSnippet'), {
    ssr: false,
});
const menuPrimitiveList = dynamic(() => import('./tabs/menuPrimitiveList'), {
    ssr: false,
});
const menuStatistics = dynamic(() => import('./tabs/menuStatistics'), {
    ssr: false,
});
