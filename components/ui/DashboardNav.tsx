"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNotifications } from "@/hooks/useNotifications";
import { Bell, Code2, BarChart3, Trophy, PlusCircle, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

type Props = {
  user?: { id: string; name?: string; email?: string; username?: string; displayName?: string; image?: string };
  initialUnreadCount: number;
};

export default function DashboardNav({ user, initialUnreadCount }: Props) {
  const pathname = usePathname();
  const { unreadCount } = useNotifications(user?.id || "");
  const displayCount = unreadCount || initialUnreadCount;

  const navLinks = [
    { href: "/feed", label: "Feed", icon: Code2 },
    { href: "/submit", label: "Submit", icon: PlusCircle },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  ];

  return (
    <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/feed" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              DevPulse
            </span>
          </Link>

          <div className="flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith(href)
                    ? "bg-blue-600/20 text-blue-400"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <>
                <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
                  <Bell className="w-5 h-5" />
                  {displayCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
                      {displayCount > 99 ? "99+" : displayCount}
                    </span>
                  )}
                </button>
                <Link
                  href={`/profile/${(user as any).username || user.email?.split("@")[0]}`}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  {user.image ? (
                    <img src={user.image} alt="Avatar" className="w-7 h-7 rounded-full" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold">
                      {(user.name || user.email || "U")[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm text-gray-300">{user.name || user.email}</span>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
