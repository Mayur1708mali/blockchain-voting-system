"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

interface VoterDetail {
  id: string;
  name: string;
  email: string;
  prn: string;
  class: string;
  role: string;
  approved: boolean;
  walletAddress: string | null;
  createdAt: string;
  updatedAt: string;
  voterApprovals: {
    election: {
      id: string;
      title: string;
      status: string;
      startDate: string;
      endDate: string;
    };
  }[];
}

export default function VoterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [voter, setVoter] = useState<VoterDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVoter();
  }, [params.id]);

  const fetchVoter = async () => {
    try {
      const res = await fetch(`/api/admin/voters/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setVoter(data);
      } else {
        toast.error("Voter not found");
        router.push("/admin/voters");
      }
    } catch {
      toast.error("Failed to load voter details");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm("Approve this voter? A blockchain wallet will be generated."))
      return;

    try {
      const res = await fetch(`/api/admin/voters/${params.id}/approve`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Voter approved!");
        fetchVoter();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Failed to approve voter");
    }
  };

  const handleReject = async () => {
    if (!confirm("Reject and remove this voter?")) return;

    try {
      const res = await fetch(`/api/admin/voters/${params.id}/reject`, {
        method: "PATCH",
      });
      if (res.ok) {
        toast.success("Voter rejected");
        router.push("/admin/voters");
      } else {
        const data = await res.json();
        toast.error(data.error);
      }
    } catch {
      toast.error("Failed to reject voter");
    }
  };

  const handleFundWallet = async () => {
    if (!confirm("Fund this voter's wallet with 0.1 ETH?")) return;

    try {
      const res = await fetch(`/api/admin/voters/${params.id}/fund`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Wallet funded successfully!");
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Failed to fund wallet");
    }
  };

  if (loading || !voter) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    CLOSED: "bg-red-100 text-red-700",
    DRAFT: "bg-gray-100 text-gray-700",
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/voters"
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Voter Details</h1>
        </div>
        {!voter.approved && (
          <div className="flex gap-2">
            <button
              onClick={handleApprove}
              className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Approve
            </button>
            <button
              onClick={handleReject}
              className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Reject
            </button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-indigo-600">
              {voter.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {voter.name}
            </h2>
            <p className="text-sm text-gray-500">{voter.email}</p>
          </div>
          <span
            className={`ml-auto px-3 py-1 text-xs font-medium rounded-full ${
              voter.approved
                ? "bg-green-100 text-green-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {voter.approved ? "Approved" : "Pending Approval"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">
              PRN
            </p>
            <p className="text-sm font-mono text-gray-900">{voter.prn}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">
              Class
            </p>
            <p className="text-sm text-gray-900">{voter.class}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">
              Role
            </p>
            <p className="text-sm text-gray-900">{voter.role}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">
              Registered
            </p>
            <p className="text-sm text-gray-900">
              {new Date(voter.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Wallet Info */}
      {voter.walletAddress && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Blockchain Wallet
            </h3>
            <button
              onClick={handleFundWallet}
              className="px-3 py-1.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
            >
              Fund Wallet (0.1 ETH)
            </button>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">
              Wallet Address
            </p>
            <p className="text-sm font-mono text-gray-900 break-all">
              {voter.walletAddress}
            </p>
          </div>
        </div>
      )}

      {/* Assigned Elections */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Assigned Elections
        </h3>
        {voter.voterApprovals.length === 0 ? (
          <p className="text-sm text-gray-500">
            This voter hasn&apos;t been assigned to any elections yet.
          </p>
        ) : (
          <div className="space-y-3">
            {voter.voterApprovals.map((approval) => (
              <Link
                key={approval.election.id}
                href={`/admin/elections/${approval.election.id}`}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {approval.election.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(
                      approval.election.startDate
                    ).toLocaleDateString()}{" "}
                    –{" "}
                    {new Date(
                      approval.election.endDate
                    ).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    statusColors[approval.election.status] ||
                    "bg-gray-100 text-gray-700"
                  }`}
                >
                  {approval.election.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
