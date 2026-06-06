"use server";

import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { getUserFromSession } from "@/lib/auth";

export async function markNotificationRead(
  notificationId: string
): Promise<{ success: boolean }> {
  const user = await getUserFromSession();
  if (!user) return { success: false };

  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });
  if (!notification || notification.userId !== user.id) return { success: false };

  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });

  // Invalidate notification cache
  await redis.del(`notif:unread:${user.id}`);
  return { success: true };
}

export async function markAllNotificationsRead(): Promise<{
  updatedCount: number;
}> {
  const user = await getUserFromSession();
  if (!user) return { updatedCount: 0 };

  const result = await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });

  await redis.del(`notif:unread:${user.id}`);
  return { updatedCount: result.count };
}

export async function getUnreadNotificationCount(): Promise<number> {
  const user = await getUserFromSession();
  if (!user) return 0;

  const cacheKey = `notif:unread:${user.id}`;
  const cached = await redis.get<number>(cacheKey);
  if (cached !== null) return Number(cached);

  const count = await prisma.notification.count({
    where: { userId: user.id, isRead: false },
  });

  await redis.set(cacheKey, count, { ex: 30 });
  return count;
}
