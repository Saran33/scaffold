import { accountPageConfig } from '@/config/dashboard';

import { CardSkeleton } from '@/components/card-skeleton';
import { DashboardHeader } from '@/components/layout/header';
import { DashboardShell } from '@/components/layout/shell';

export default function DashboardSettingsLoading() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Account Settings"
        text={accountPageConfig.description}
      />
      <div className="grid gap-10">
        <CardSkeleton />
      </div>
    </DashboardShell>
  );
}
