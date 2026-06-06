import { PrismaClient } from "@prisma/client";
import { DEFAULT_TAGS } from "../lib/constants";

const prisma = new PrismaClient();

async function main() {
  for (const tag of DEFAULT_TAGS) {
    await prisma.tag.upsert({
      where: { name: tag.name },
      update: {},
      create: tag,
    });
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
