"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getPusherClient } from "@/lib/pusher";
import { markNotificationRead, markAllNotificationsRead } from "@/app/actions/notification-actions";
import { NotificationItem } from "@/types";

export function useNotifications(userId: string): {
  notifications: NotificationItem[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
} {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const pusherRef = useRef<ReturnType<typeof getPusherClient>>(null);

  // Load initial notifications
  useEffect(() => {
    if (!userId) return;
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        if (data?.data?.notifications) {
          setNotifications(data.data.notifications);
          setUnreadCount(data.data.notifications.filter((n: NotificationItem) => !n.isRead).length);
        }
      })
      .catch(console.error);
  }, [userId]);

  // Subscribe to real-time Pusher channel
  useEffect(() => {
    if (!userId) return;
    const client = getPusherClient();
    if (!client) return;
    pusherRef.current = client;

    const channel = client.subscribe(`private-user-${userId}`);
    channel.bind("new-notification", (data: any) => {
      const newNotification: NotificationItem = {
        id: data.id || `temp-${Date.now()}`,
        type: data.type,
        message: data.message,
        isRead: false,
        createdAt: new Date().toISOString(),
        userId,
        metadata: data,
      };
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      channel.unbind_all();
      client.unsubscribe(`private-user-${userId}`);
      client.disconnect();
    };
  }, [userId]);

  const markRead = useCallback(
    (id: string) => {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      markNotificationRead(id).catch(console.error);
    },
    []
  );

  const markAllRead = useCallback(() => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    markAllNotificationsRead().catch(console.error);
  }, []);

  return { notifications, unreadCount, markRead, markAllRead };
}
