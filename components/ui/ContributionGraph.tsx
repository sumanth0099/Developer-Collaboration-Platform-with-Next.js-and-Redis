import { ContributionDay } from "@/types";

type Props = { data: ContributionDay[] };

function getColor(count: number): string {
  if (count === 0) return "bg-gray-800";
  if (count <= 2) return "bg-green-900";
  if (count <= 5) return "bg-green-700";
  if (count <= 8) return "bg-green-500";
  return "bg-green-400";
}

export default function ContributionGraph({ data }: Props) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex flex-wrap gap-1">
        {data.map((day) => (
          <div key={day.date} title={`${day.date}: ${day.count} contributions`}
            className={`w-3.5 h-3.5 rounded-sm ${getColor(day.count)} transition-colors hover:ring-1 hover:ring-green-400`} />
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
        <span>Less</span>
        {["bg-gray-800", "bg-green-900", "bg-green-700", "bg-green-500", "bg-green-400"].map((c) => (
          <div key={c} className={`w-3.5 h-3.5 rounded-sm ${c}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
