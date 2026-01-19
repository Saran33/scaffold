import type { ReactElement, ReactNode } from 'react';
import { type NextPage } from 'next';
import { type Session } from 'next-auth';

export type NextPageWithAuthAndLayout<P = unknown, IP = P> = NextPage<P, IP> & {
  authRequired?: boolean;
  getLayout?: (page: ReactElement) => ReactNode;
};

export type ExtendedAppProps<P = unknown> = {
  Component: NextPageWithAuthAndLayout<P>;
  pageProps: P & { session: Session | null };
};
