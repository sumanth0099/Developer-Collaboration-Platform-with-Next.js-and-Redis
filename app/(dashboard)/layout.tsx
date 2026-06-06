export const dynamic = "force-dynamic";

import { getServerSession } from "@/lib/auth";
import { getUnreadNotificationCount } from "@/app/actions/notification-actions";
import DashboardNav from "@/components/ui/DashboardNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  const unreadCount = session ? await getUnreadNotificationCount() : 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <DashboardNav
        user={session?.user as any}
        initialUnreadCount={unreadCount}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
