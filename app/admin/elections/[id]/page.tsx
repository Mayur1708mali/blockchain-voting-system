"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

interface Election {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  contractAddress: string | null;
  onChainId: number | null;
  createdBy: { name: string; email: string };
  candidates: { id: string; name: string; description: string | null; candidateIndex: number }[];
  voterApprovals: { user: { name: string; email: string } }[];
}

export default function ElectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [election, setElection] = useState<Election | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchElection = async () => {
    try {
      const res = await fetch(`/api/admin/elections/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setElection(data);
      } else {
        toast.error("Election not found");
        router.push("/admin/elections");
      }
    } catch (error) {
      toast.error("Failed to load election");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchElection();
  }, [params.id]);

  const handleActivate = async () => {
    if (!confirm("Activate this election on the blockchain?")) return;
    try {
      const res = await fetch(`/api/admin/elections/${params.id}/activate`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Election activated!");
        fetchElection();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Failed to activate");
    }
  };

  const handleClose = async () => {
    if (!confirm("Close this election? This is irreversible.")) return;
    try {
      const res = await fetch(`/api/admin/elections/${params.id}/close`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Election closed!");
        fetchElection();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Failed to close");
    }
  };

  if (loading || !election) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700",
    ACTIVE: "bg-green-100 text-green-700",
    CLOSED: "bg-red-100 text-red-700",
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin/elections" className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block">
            ← Back to Elections
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{election.title}</h1>
        </div>
        <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[election.status]}`}>
          {election.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
            {election.description && (
              <p className="text-gray-600 mb-4">{election.description}</p>
            )}
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Type</dt>
                <dd className="font-medium text-gray-900">{election.type.replace("_", " ")}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Created By</dt>
                <dd className="font-medium text-gray-900">{election.createdBy.name}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Start Date</dt>
                <dd className="font-medium text-gray-900">
                  {new Date(election.startDate).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">End Date</dt>
                <dd className="font-medium text-gray-900">
                  {new Date(election.endDate).toLocaleString()}
                </dd>
              </div>
              {election.contractAddress && (
                <div className="col-span-2">
                  <dt className="text-gray-500">Contract Address</dt>
                  <dd className="font-mono text-xs text-gray-900 break-all">
                    {election.contractAddress}
                  </dd>
                </div>
              )}
              {election.onChainId && (
                <div>
                  <dt className="text-gray-500">On-Chain ID</dt>
                  <dd className="font-mono text-gray-900">{election.onChainId}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Candidates */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Candidates ({election.candidates.length})
            </h2>
            <div className="space-y-3">
              {election.candidates.map((candidate) => (
                <div
                  key={candidate.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <span className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-sm font-medium">
                    {candidate.candidateIndex + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{candidate.name}</p>
                    {candidate.description && (
                      <p className="text-sm text-gray-500">{candidate.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
            <div className="space-y-2">
              {election.status === "DRAFT" && (
                <button
                  onClick={handleActivate}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Activate Election
                </button>
              )}
              {election.status === "ACTIVE" && (
                <button
                  onClick={handleClose}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Close Election
                </button>
              )}
              {election.status === "CLOSED" && (
                <Link
                  href={`/elections/${election.id}/results`}
                  className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium text-center"
                >
                  View Results
                </Link>
              )}
            </div>
          </div>

          {/* Assigned Voters */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Assigned Voters ({election.voterApprovals.length})
            </h2>
            {election.voterApprovals.length === 0 ? (
              <p className="text-sm text-gray-500">No voters assigned yet.</p>
            ) : (
              <ul className="space-y-2">
                {election.voterApprovals.map((va, idx) => (
                  <li key={idx} className="text-sm text-gray-700">
                    {va.user.name} ({va.user.email})
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
