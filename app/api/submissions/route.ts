export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { getUserFromSession } from "@/lib/auth";
import { createSubmissionSchema } from "@/lib/validations";
import { createHash } from "crypto";
import { DifficultyTag, SubmissionStatus } from "@prisma/client";

function hashQueryParams(params: Record<string, string>): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha256").update(sorted).digest("hex");
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);
    const status = searchParams.get("status") as SubmissionStatus | null;
    const language = searchParams.get("language");
    const difficulty = searchParams.get("difficulty") as DifficultyTag | null;
    const sort = searchParams.get("sort") || "newest";
    const tag = searchParams.get("tag");

    const queryParams: Record<string, string> = {
      page: String(page), limit: String(limit),
      ...(status && { status }), ...(language && { language }),
      ...(difficulty && { difficulty }), sort,
      ...(tag && { tag }),
    };
    const cacheKey = `cache:submissions:${hashQueryParams(queryParams)}`;

    const cached = await redis.get<string>(cacheKey);
    if (cached) {
      return NextResponse.json(typeof cached === "string" ? JSON.parse(cached) : cached);
    }

    const user = await getUserFromSession();
    const where: any = {};
    if (status) where.status = status;
    if (language) where.language = language;
    if (difficulty) where.difficultyTag = difficulty;
    if (tag) where.tags = { some: { tag: { name: tag } } };

    const orderBy: any =
      sort === "oldest" ? { createdAt: "asc" }
      : sort === "most_voted" ? { votes: { _count: "desc" } }
      : sort === "most_reviewed" ? { reviews: { _count: "desc" } }
      : { createdAt: "desc" };

    const [total, submissions] = await Promise.all([
      prisma.submission.count({ where }),
      prisma.submission.findMany({
        where, orderBy, skip: (page - 1) * limit, take: limit,
        include: {
          author: { select: { id: true, username: true, displayName: true, avatarUrl: true, reputation: true } },
          _count: { select: { reviews: true, votes: true } },
          tags: { include: { tag: { select: { id: true, name: true, color: true } } } },
          votes: user ? { where: { userId: user.id }, select: { voteType: true } } : false,
        },
      }),
    ]);

    const data = {
      data: {
        submissions: submissions.map((s) => ({
          id: s.id, title: s.title, description: s.description, language: s.language,
          status: s.status, difficultyTag: s.difficultyTag, viewCount: s.viewCount,
          createdAt: s.createdAt.toISOString(), author: s.author,
          _count: s._count,
          tags: s.tags.map((t) => t.tag),
          userVote: user && s.votes && s.votes.length > 0 ? (s.votes as any[])[0].voteType : null,
        })),
      },
      meta: {
        total, page, limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };

    await redis.set(cacheKey, JSON.stringify(data), { ex: 60 });
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/submissions error:", error);
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromSession();
    if (!user) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

    const body = await request.json();
    const parsed = createSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten(), code: "VALIDATION_ERROR" }, { status: 422 });
    }

    const { title, description, codeContent, language, difficultyTag, tagIds } = parsed.data;

    const submission = await prisma.$transaction(async (tx) => {
      const newSubmission = await tx.submission.create({
        data: {
          title, description, codeContent, language, difficultyTag, authorId: user.id,
          tags: { create: tagIds.map((tagId) => ({ tagId })) },
        },
        include: {
          author: { select: { id: true, username: true, displayName: true, avatarUrl: true, reputation: true } },
          tags: { include: { tag: true } },
        },
      });
      await tx.user.update({ where: { id: user.id }, data: { reputation: { increment: 5 } } });
      return newSubmission;
    });

    // Invalidate submissions cache
    const cacheKeys = await redis.keys("cache:submissions:*");
    if (cacheKeys.length > 0) {
      await Promise.all(cacheKeys.map((k) => redis.del(k)));
    }

    return NextResponse.json({ data: submission }, { status: 201 });
  } catch (error) {
    console.error("POST /api/submissions error:", error);
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
