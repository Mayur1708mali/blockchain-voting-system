"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Voter {
  id: string;
  name: string;
  email: string;
  approved: boolean;
  walletAddress: string | null;
  createdAt: string;
  voterApprovals: {
    election: { id: string; title: string; status: string };
  }[];
}

interface Election {
  id: string;
  title: string;
  status: string;
}

export default function VotersPage() {
  const { data: session } = useSession();
  const [voters, setVoters] = useState<Voter[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const [assignModal, setAssignModal] = useState<{
    open: boolean;
    voterId: string;
  }>({ open: false, voterId: "" });

  const role = (session?.user as any)?.role;
  const isReadOnly = role === "AUDITOR";

  const fetchVoters = async () => {
    try {
      const res = await fetch(`/api/admin/voters?status=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setVoters(data);
      }
    } catch (error) {
      toast.error("Failed to load voters");
    } finally {
      setLoading(false);
    }
  };

  const fetchElections = async () => {
    try {
      const res = await fetch("/api/admin/elections");
      if (res.ok) {
        const data = await res.json();
        setElections(data.filter((e: Election) => e.status !== "CLOSED"));
      }
    } catch {}
  };

  useEffect(() => {
    fetchVoters();
    fetchElections();
  }, [filter]);

  const handleApprove = async (id: string) => {
    if (!confirm("Approve this voter? A blockchain wallet will be generated."))
      return;

    try {
      const res = await fetch(`/api/admin/voters/${id}/approve`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Voter approved!");
        fetchVoters();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Failed to approve voter");
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Reject and remove this voter?")) return;

    try {
      const res = await fetch(`/api/admin/voters/${id}/reject`, {
        method: "PATCH",
      });
      if (res.ok) {
        toast.success("Voter rejected");
        fetchVoters();
      } else {
        const data = await res.json();
        toast.error(data.error);
      }
    } catch {
      toast.error("Failed to reject voter");
    }
  };

  const handleAssign = async (electionId: string) => {
    try {
      const res = await fetch(
        `/api/admin/voters/${assignModal.voterId}/assign-election`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ electionId }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        toast.success("Voter assigned to election!");
        setAssignModal({ open: false, voterId: "" });
        fetchVoters();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Failed to assign voter");
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
        <h1 className="text-2xl font-bold text-gray-900">Voter Management</h1>
        <div className="flex gap-2">
          {(["all", "pending", "approved"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                filter === f
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {voters.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <p className="text-gray-500">No voters found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Wallet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Elections
                </th>
                {!isReadOnly && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {voters.map((voter) => (
                <tr key={voter.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    <Link
                      href={`/admin/voters/${voter.id}`}
                      className="text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                      {voter.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {voter.email}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        voter.approved
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {voter.approved ? "Approved" : "Pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-gray-500">
                    {voter.walletAddress
                      ? `${voter.walletAddress.slice(0, 6)}...${voter.walletAddress.slice(-4)}`
                      : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {voter.voterApprovals.length > 0
                      ? voter.voterApprovals
                          .map((va) => va.election.title)
                          .join(", ")
                      : "None"}
                  </td>
                  {!isReadOnly && (
                    <td className="px-6 py-4 space-x-2">
                      {!voter.approved && (
                        <>
                          <button
                            onClick={() => handleApprove(voter.id)}
                            className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded hover:bg-green-200"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(voter.id)}
                            className="px-3 py-1 text-xs font-medium bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {voter.approved && (
                        <button
                          onClick={() =>
                            setAssignModal({ open: true, voterId: voter.id })
                          }
                          className="px-3 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                        >
                          Assign Election
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign Election Modal */}
      {assignModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Assign to Election
            </h2>
            {elections.length === 0 ? (
              <p className="text-gray-500">No active elections available.</p>
            ) : (
              <div className="space-y-2">
                {elections.map((election) => (
                  <button
                    key={election.id}
                    onClick={() => handleAssign(election.id)}
                    className="w-full text-left px-4 py-3 border rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                  >
                    <p className="font-medium text-gray-900">
                      {election.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      Status: {election.status}
                    </p>
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setAssignModal({ open: false, voterId: "" })}
              className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
