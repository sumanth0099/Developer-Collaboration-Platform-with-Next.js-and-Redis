"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import SubmissionCard from "./SubmissionCard";
import { SubmissionListItem } from "@/types";
import { SUPPORTED_LANGUAGES } from "@/lib/constants";

type Filters = {
  language?: string;
  difficulty?: string;
  status?: string;
  sort?: string;
  tag?: string;
};

type TagOption = { id: string; name: string; color: string };

type Props = {
  initialData: SubmissionListItem[];
  initialTotal: number;
  filters: Filters;
  tags: TagOption[];
  currentUserId?: string;
};

async function fetchSubmissions(filters: Filters, pageParam: number) {
  const params = new URLSearchParams({ page: String(pageParam), limit: "10", ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) });
  const res = await fetch(`/api/submissions?${params}`, { cache: "no-store" });
  const data = await res.json();
  return data;
}

export default function SubmissionFeed({ initialData, initialTotal, filters, tags, currentUserId }: Props) {
  const [activeFilters, setActiveFilters] = useState<Filters>(filters);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useInfiniteQuery({
    queryKey: ["submissions", activeFilters],
    queryFn: ({ pageParam }) => fetchSubmissions(activeFilters, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta?.hasNextPage ? lastPage.meta.page + 1 : undefined,
    initialData: {
      pages: [{ data: { submissions: initialData }, meta: { total: initialTotal, page: 1, limit: 10, totalPages: Math.ceil(initialTotal / 10), hasNextPage: initialTotal > 10, hasPrevPage: false } }],
      pageParams: [1],
    },
  });

  const queryClient = useQueryClient();
  const voteMutation = useMutation({
    mutationFn: async ({ submissionId, voteType }: { submissionId: string; voteType: string }) => {
      const res = await fetch("/api/votes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ submissionId, voteType }) });
      return res.json();
    },
    onMutate: async () => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["submissions", activeFilters] });
      const prev = queryClient.getQueryData(["submissions", activeFilters]);
      return { prev };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions", activeFilters] });
    },
  });

  const allSubmissions = data?.pages.flatMap((page) => page.data?.submissions ?? []) ?? [];

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setActiveFilters((prev) => ({ ...prev, [key]: value || undefined }));
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 p-4 bg-gray-900 rounded-xl border border-gray-800">
        <select onChange={(e) => handleFilterChange("language", e.target.value)}
          className="bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg text-sm border border-gray-700 focus:outline-none focus:border-blue-500">
          <option value="">All Languages</option>
          {SUPPORTED_LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <select onChange={(e) => handleFilterChange("difficulty", e.target.value)}
          className="bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg text-sm border border-gray-700 focus:outline-none focus:border-blue-500">
          <option value="">All Difficulties</option>
          {["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"].map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select onChange={(e) => handleFilterChange("status", e.target.value)}
          className="bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg text-sm border border-gray-700 focus:outline-none focus:border-blue-500">
          <option value="">All Status</option>
          {["PENDING", "UNDER_REVIEW", "REVIEWED", "CLOSED"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select onChange={(e) => handleFilterChange("sort", e.target.value)}
          className="bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg text-sm border border-gray-700 focus:outline-none focus:border-blue-500">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="most_voted">Most Voted</option>
          <option value="most_reviewed">Most Reviewed</option>
        </select>
        <select
          value={activeFilters.tag ?? ""}
          onChange={(e) => handleFilterChange("tag", e.target.value)}
          className="bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg text-sm border border-gray-700 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Tags</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.name}>{tag.name}</option>
          ))}
        </select>
      </div>

      {/* Submission Cards */}
      <div className="space-y-4">
        {status === ("pending" as string) ? (
          <div className="space-y-4 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-xl h-40" />
            ))}
          </div>
        ) : allSubmissions.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No submissions found.</div>
        ) : (
          allSubmissions.map((s) => (
            <SubmissionCard
              key={s.id}
              submission={s}
              currentUserId={currentUserId}
              onVote={(submissionId, voteType) => voteMutation.mutate({ submissionId, voteType })}
            />
          ))
        )}
      </div>

      {hasNextPage && (
        <div className="text-center">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl font-semibold transition-colors"
          >
            {isFetchingNextPage ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
