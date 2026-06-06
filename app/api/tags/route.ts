export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { ensureDefaultTags } from "@/lib/tags";

export async function GET() {
  try {
    const tags = await ensureDefaultTags();
    return NextResponse.json({ data: { tags } });
  } catch (error) {
    console.error("GET /api/tags error:", error);
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
