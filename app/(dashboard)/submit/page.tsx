export const dynamic = "force-dynamic";

import { getServerSession } from "@/lib/auth";
import { ensureDefaultTags } from "@/lib/tags";
import { redirect } from "next/navigation";
import SubmitForm from "@/components/forms/SubmitForm";

export default async function SubmitPage() {
  const session = await getServerSession();
  if (!session?.user) redirect("/login");

  const tags = await ensureDefaultTags();

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
          Submit for Review
        </h1>
        <p className="text-gray-400 mt-2">Share your code and get feedback from the community</p>
      </div>
      <SubmitForm initialTags={tags} />
    </div>
  );
}
