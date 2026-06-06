type Props = {
  reputation: number;
  totalSubmissions: number;
  totalReviews: number;
  totalVotes: number;
};

export default function ProfileStats({ reputation, totalSubmissions, totalReviews, totalVotes }: Props) {
  const stats = [
    { label: "Reputation", value: reputation, color: "text-yellow-400" },
    { label: "Submissions", value: totalSubmissions, color: "text-blue-400" },
    { label: "Reviews Given", value: totalReviews, color: "text-purple-400" },
    { label: "Upvotes Received", value: totalVotes, color: "text-green-400" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map(({ label, value, color }) => (
        <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className={`text-3xl font-bold ${color}`}>{value}</div>
          <div className="text-sm text-gray-400 mt-1">{label}</div>
        </div>
      ))}
    </div>
  );
}
