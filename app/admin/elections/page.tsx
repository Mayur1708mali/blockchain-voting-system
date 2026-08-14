"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Election {
  id: string;
  title: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  createdBy: { name: string; email: string };
  _count: { voterApprovals: number };
  candidates: { id: string; name: string }[];
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  ACTIVE: "bg-green-100 text-green-700",
  CLOSED: "bg-red-100 text-red-700",
};

export default function ElectionsPage() {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchElections = async () => {
    try {
      const res = await fetch("/api/admin/elections");
      if (res.ok) {
        const data = await res.json();
        setElections(data);
      }
    } catch (error) {
      toast.error("Failed to load elections");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchElections();
  }, []);

  const handleActivate = async (id: string) => {
    if (!confirm("Are you sure you want to activate this election? This will register it on the blockchain.")) return;

    try {
      const res = await fetch(`/api/admin/elections/${id}/activate`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Election activated on blockchain!");
        fetchElections();
      } else {
        toast.error(data.error || "Failed to activate");
      }
    } catch (error) {
      toast.error("Failed to activate election");
    }
  };

  const handleClose = async (id: string) => {
    if (!confirm("Are you sure you want to close this election? This action is irreversible.")) return;

    try {
      const res = await fetch(`/api/admin/elections/${id}/close`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Election closed successfully!");
        fetchElections();
      } else {
        toast.error(data.error || "Failed to close");
      }
    } catch (error) {
      toast.error("Failed to close election");
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Elections</h1>
        <Link
          href="/admin/elections/new"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
        >
          + Create Election
        </Link>
      </div>

      {elections.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-500">No elections yet. Create your first one!</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Voters</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {elections.map((election) => (
                <tr key={election.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/elections/${election.id}`}
                      className="text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      {election.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {election.type.replace("_", " ")}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[election.status]}`}>
                      {election.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {election.candidates.length}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {election._count.voterApprovals}
                  </td>
                  <td className="px-6 py-4 space-x-2">
                    {election.status === "DRAFT" && (
                      <button
                        onClick={() => handleActivate(election.id)}
                        className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        Activate
                      </button>
                    )}
                    {election.status === "ACTIVE" && (
                      <button
                        onClick={() => handleClose(election.id)}
                        className="px-3 py-1 text-xs font-medium bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Close
                      </button>
                    )}
                    {election.status === "CLOSED" && (
                      <Link
                        href={`/elections/${election.id}/results`}
                        className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        View Results
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
