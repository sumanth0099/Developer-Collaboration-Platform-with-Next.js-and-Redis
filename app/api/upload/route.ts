export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import { validateUploadedFile } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const user = await getUserFromSession();
    if (!user) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("snapshot") as File | null;
    const submissionId = formData.get("submissionId") as string | null;

    if (!file) return NextResponse.json({ error: "No file uploaded", code: "MISSING_FILE" }, { status: 400 });
    if (!submissionId) return NextResponse.json({ error: "submissionId is required", code: "MISSING_FIELD" }, { status: 400 });

    const validation = validateUploadedFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error, code: "INVALID_FILE" }, { status: 400 });
    }

    let imageUrl: string;
    try {
      const blob = await put(`snapshots/${submissionId}/${Date.now()}-${file.name}`, file, { access: "public" });
      imageUrl = blob.url;
    } catch {
      // Fallback for local dev when BLOB_READ_WRITE_TOKEN is not set
      imageUrl = `https://placeholder.local/snapshots/${submissionId}/${file.name}`;
    }

    const snapshot = await prisma.codeSnapshot.create({
      data: { submissionId, imageUrl },
    });

    return NextResponse.json({
      data: { snapshotId: snapshot.id, imageUrl: snapshot.imageUrl },
    });
  } catch (error) {
    console.error("POST /api/upload error:", error);
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
