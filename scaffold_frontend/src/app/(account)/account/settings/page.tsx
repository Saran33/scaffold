import { getAuth } from '@/server/auth/session';
import { accountPageConfig } from '@/config/account';
import { DashboardHeader } from '@/components/layout/header';
import { DashboardShell } from '@/components/layout/shell';
import { UserSettings } from '@/components/user-account-settings';

export const metadata = {
  title: accountPageConfig.title,
  description: accountPageConfig.description,
};

export default async function SettingsPage() {
  const { user, accessToken, session } = await getAuth();

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Account Settings"
        text={accountPageConfig.description}
      />
      <div className="grid gap-10">
        <UserSettings
          user={{
            id: user.id,
            name: user.name || '',
            email: user.email,
            sub: user.sub,
          }}
          accessToken={accessToken}
          session={session}
        />
      </div>
    </DashboardShell>
  );
}
