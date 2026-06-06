export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { getUserFromSession } from "@/lib/auth";

const VIEW_SYNC_THRESHOLD = 10;
const VIEW_SYNC_INTERVAL_MS = 5 * 60 * 1000;

async function syncViewCount(submissionId: string, redisCount: number) {
  await prisma.submission.update({
    where: { id: submissionId },
    data: { viewCount: { increment: redisCount } },
  });
  await redis.set(`viewcount:${submissionId}`, 0);
  await redis.set(`viewcount:${submissionId}:lastSync`, Date.now());
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Atomic view count increment via Redis
    const countKey = `viewcount:${id}`;
    const syncKey = `viewcount:${id}:lastSync`;
    const redisCount = await redis.incr(countKey);
    const lastSync = await redis.get<number>(syncKey);
    const now = Date.now();

    if (
      redisCount >= VIEW_SYNC_THRESHOLD ||
      !lastSync ||
      now - Number(lastSync) > VIEW_SYNC_INTERVAL_MS
    ) {
      await syncViewCount(id, redisCount);
    }

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true, reputation: true } },
        reviews: {
          include: {
            reviewer: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        votes: true,
        tags: { include: { tag: true } },
        snapshots: true,
        _count: { select: { reviews: true, votes: true } },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found", code: "NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        ...submission,
        createdAt: submission.createdAt.toISOString(),
        updatedAt: submission.updatedAt.toISOString(),
        reviews: submission.reviews.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        })),
        snapshots: submission.snapshots.map((s) => ({
          ...s,
          uploadedAt: s.uploadedAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error("GET /api/submissions/[id] error:", error);
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromSession();
    if (!user) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

    const { id } = params;
    const submission = await prisma.submission.findUnique({ where: { id } });
    if (!submission) return NextResponse.json({ error: "Not found", code: "NOT_FOUND" }, { status: 404 });
    if (submission.authorId !== user.id) return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });

    const body = await request.json();
    const allowedFields = ["title", "description", "codeContent", "status"];
    const updates: Record<string, any> = {};
    for (const key of Object.keys(body)) {
      if (!allowedFields.includes(key)) {
        return NextResponse.json({ error: `Field '${key}' cannot be updated`, code: "INVALID_FIELD" }, { status: 400 });
      }
      updates[key] = body[key];
    }

    const updated = await prisma.submission.update({ where: { id }, data: updates });
    // Invalidate cache
    await redis.del(`cache:submission:${id}`);
    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("PATCH /api/submissions/[id] error:", error);
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromSession();
    if (!user) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

    const { id } = params;
    const submission = await prisma.submission.findUnique({ where: { id } });
    if (!submission) return NextResponse.json({ error: "Not found", code: "NOT_FOUND" }, { status: 404 });
    if (submission.authorId !== user.id) return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });

    await prisma.$transaction([
      prisma.vote.deleteMany({ where: { submissionId: id } }),
      prisma.submissionTag.deleteMany({ where: { submissionId: id } }),
      prisma.codeSnapshot.deleteMany({ where: { submissionId: id } }),
      prisma.review.deleteMany({ where: { submissionId: id } }),
      prisma.submission.delete({ where: { id } }),
    ]);

    await redis.del(`cache:submission:${id}`);
    const cacheKeys = await redis.keys("cache:submissions:*");
    if (cacheKeys.length > 0) await Promise.all(cacheKeys.map((k) => redis.del(k)));

    return NextResponse.json({ data: { deleted: true } });
  } catch (error) {
    console.error("DELETE /api/submissions/[id] error:", error);
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
