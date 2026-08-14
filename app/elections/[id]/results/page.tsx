"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface CandidateResult {
  name: string;
  description: string | null;
  votes: number;
  percentage: string;
}

interface ElectionResults {
  election: {
    id: string;
    title: string;
    description: string | null;
    type: string;
    startDate: string;
    endDate: string;
    contractAddress: string | null;
  };
  results: CandidateResult[];
  totalVotes: number;
  winners: string[];
}

const COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#14b8a6",
];

export default function ResultsPage() {
  const params = useParams();
  const [data, setData] = useState<ElectionResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  useEffect(() => {
    async function fetchResults() {
      try {
        const res = await fetch(`/api/elections/${params.id}/results`);
        const json = await res.json();

        if (res.ok) {
          setData(json);
        } else if (res.status === 403) {
          setError(json.error);
          setEndDate(json.endDate);
        } else {
          setError(json.error || "Failed to load results");
        }
      } catch {
        setError("Failed to load results");
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-3xl px-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Results Not Available Yet
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          {endDate && (
            <p className="text-sm text-gray-500">
              Election ends: {new Date(endDate).toLocaleString()}
            </p>
          )}
          <Link
            href="/"
            className="inline-block mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const chartData = data.results.map((r) => ({
    name: r.name,
    votes: r.votes,
  }));

  const exportCSV = () => {
    const headers = "Candidate,Votes,Percentage\n";
    const rows = data.results
      .map((r) => `${r.name},${r.votes},${r.percentage}%`)
      .join("\n");
    const csv = headers + rows + `\n\nTotal Votes,${data.totalVotes}\nWinner(s),${data.winners.join(" & ")}`;

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.election.title.replace(/\s+/g, "_")}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Election Results
          </h1>
          <h2 className="text-xl text-gray-600">{data.election.title}</h2>
          {data.election.description && (
            <p className="text-gray-500 mt-1">{data.election.description}</p>
          )}
        </div>

        {/* Winner Banner */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white text-center mb-8">
          <p className="text-sm opacity-80 mb-1">Winner</p>
          <p className="text-2xl font-bold">{data.winners.join(" & ")}</p>
          <p className="text-sm opacity-80 mt-1">
            Total votes cast: {data.totalVotes}
          </p>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Vote Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="votes" radius={[4, 4, 0, 0]}>
                {chartData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Results Table */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Detailed Results
            </h3>
            <button
              onClick={exportCSV}
              className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Export CSV
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  Candidate
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                  Votes
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                  Percentage
                </th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((result, index) => (
                <tr key={index} className="border-b last:border-0">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                      <span className="font-medium text-gray-900">
                        {result.name}
                      </span>
                      {data.winners.includes(result.name) && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                          Winner
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-gray-900">
                    {result.votes}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600">
                    {result.percentage}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Blockchain Info */}
        {data.election.contractAddress && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Blockchain Verification
            </h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Contract Address</dt>
                <dd className="font-mono text-gray-800 break-all">
                  {data.election.contractAddress}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Election Period</dt>
                <dd className="text-gray-800">
                  {new Date(data.election.startDate).toLocaleString()} —{" "}
                  {new Date(data.election.endDate).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
