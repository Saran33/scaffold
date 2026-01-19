'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';

export const useBreadcrumbs = () => {
  const path = usePathname() || '/';

  return useMemo(() => {
    const pathSegments = path.split('/').filter(Boolean);
    const breadcrumbSegments = pathSegments.map((segment, index, arr) => {
      const title =
        segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      const isLast = index === arr.length - 1;
      const href = '/' + arr.slice(0, index + 1).join('/');

      return { title, href, isLast };
    });

    return breadcrumbSegments;
  }, [path]);
};
