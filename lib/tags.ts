import { prisma } from "./prisma";
import { DEFAULT_TAGS } from "./constants";

export type TagOption = {
  id: string;
  name: string;
  color: string;
};

export async function ensureDefaultTags(): Promise<TagOption[]> {
  for (const tag of DEFAULT_TAGS) {
    await prisma.tag.upsert({
      where: { name: tag.name },
      update: {},
      create: tag,
    });
  }

  return prisma.tag.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, color: true },
  });
}
