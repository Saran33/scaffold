import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your app dashboard',
};

export default function AppPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your app dashboard
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Getting Started</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            This is a placeholder page. Replace this content with your app&apos;s
            main functionality.
          </p>
        </div>
      </div>
    </div>
  );
}
