"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SUPPORTED_LANGUAGES } from "@/lib/constants";
import type { TagOption } from "@/lib/tags";
import { Check, Code2, Loader2, Tag as TagIcon, Upload } from "lucide-react";

type Props = {
  initialTags?: TagOption[];
};

export default function SubmitForm({ initialTags = [] }: Props) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    codeContent: "",
    language: "typescript",
    difficultyTag: "BEGINNER",
  });
  const [tags, setTags] = useState<TagOption[]>(initialTags);
  const [tagsLoading, setTagsLoading] = useState(initialTags.length === 0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (initialTags.length > 0) {
      setTags(initialTags);
      setTagsLoading(false);
      return;
    }

    let cancelled = false;

    async function loadTags() {
      try {
        const res = await fetch("/api/tags", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled && res.ok) {
          setTags(data.data?.tags ?? []);
        }
      } catch {
        if (!cancelled) setError("Could not load tags. Please refresh the page.");
      } finally {
        if (!cancelled) setTagsLoading(false);
      }
    }

    loadTags();
    return () => {
      cancelled = true;
    };
  }, [initialTags]);

  const toggleTag = (id: string) => {
    setSelectedTags((prev) =>
      prev.includes(id)
        ? prev.filter((t) => t !== id)
        : prev.length < 5
          ? [...prev, id]
          : prev
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTags.length === 0) {
      setError("Select at least 1 tag.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tagIds: selectedTags }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Validation failed.");
        return;
      }
      router.push(`/review/${data.data.id}`);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          Title <span className="text-red-400">*</span>
        </label>
        <input
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Descriptive title (min 10 chars)"
          required
          minLength={10}
          maxLength={200}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          Description <span className="text-red-400">*</span>
        </label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Describe what your code does (min 20 chars)"
          required
          minLength={20}
          maxLength={2000}
          rows={3}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Language</label>
          <select
            value={form.language}
            onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Difficulty</label>
          <select
            value={form.difficultyTag}
            onChange={(e) => setForm((f) => ({ ...f, difficultyTag: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            {["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
            <TagIcon className="w-4 h-4 text-blue-400" />
            Tags <span className="text-red-400">*</span>
          </label>
          <span className="text-xs text-gray-500">
            {selectedTags.length}/5 selected — click to toggle
          </span>
        </div>

        {tagsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-800 rounded-xl" />
            ))}
          </div>
        ) : tags.length === 0 ? (
          <p className="text-sm text-amber-400 bg-amber-900/20 border border-amber-800/50 rounded-xl px-4 py-3">
            No tags could be loaded. Please refresh the page.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {tags.map((tag) => {
              const isSelected = selectedTags.includes(tag.id);
              return (
                <button
                  type="button"
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  aria-pressed={isSelected}
                  className={`flex items-center justify-between gap-2 px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all cursor-pointer select-none ${
                    isSelected
                      ? "border-blue-500 bg-blue-900/40 text-white shadow-lg shadow-blue-900/20"
                      : "border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-500 hover:bg-gray-700/80"
                  }`}
                  style={
                    isSelected
                      ? {
                          borderColor: tag.color,
                          backgroundColor: `${tag.color}25`,
                          color: tag.color,
                        }
                      : undefined
                  }
                >
                  <span>{tag.name}</span>
                  {isSelected && <Check className="w-4 h-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          <Code2 className="inline w-4 h-4 mr-1" />
          Code <span className="text-red-400">*</span>
        </label>
        <textarea
          value={form.codeContent}
          onChange={(e) => setForm((f) => ({ ...f, codeContent: e.target.value }))}
          placeholder="Paste your code here..."
          required
          minLength={10}
          maxLength={50000}
          rows={12}
          className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-sm text-green-400 font-mono placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading || tagsLoading || tags.length === 0}
        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-60 rounded-xl font-semibold transition-all"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
        {loading ? "Submitting..." : "Submit for Review"}
      </button>
    </form>
  );
}
