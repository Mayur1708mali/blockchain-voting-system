"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

interface UserProfile {
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

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchProfile();
    }
  }, [status]);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else {
        toast.error("Failed to load profile");
      }
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    CLOSED: "bg-red-100 text-red-700",
    DRAFT: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <Link
            href="/vote"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-indigo-600">
                {profile.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {profile.name}
              </h2>
              <p className="text-sm text-gray-500">{profile.email}</p>
            </div>
            <span
              className={`ml-auto px-3 py-1 text-xs font-medium rounded-full ${
                profile.approved
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {profile.approved ? "Approved" : "Pending Approval"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                PRN
              </p>
              <p className="text-sm font-mono text-gray-900">{profile.prn}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                Class
              </p>
              <p className="text-sm text-gray-900">{profile.class}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                Role
              </p>
              <p className="text-sm text-gray-900">{profile.role}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                Member Since
              </p>
              <p className="text-sm text-gray-900">
                {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Wallet Info */}
        {profile.walletAddress && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Blockchain Wallet
            </h3>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                Wallet Address
              </p>
              <p className="text-sm font-mono text-gray-900 break-all">
                {profile.walletAddress}
              </p>
            </div>
          </div>
        )}

        {/* Assigned Elections */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Assigned Elections
          </h3>
          {profile.voterApprovals.length === 0 ? (
            <p className="text-sm text-gray-500">
              You haven&apos;t been assigned to any elections yet.
            </p>
          ) : (
            <div className="space-y-3">
              {profile.voterApprovals.map((approval) => (
                <div
                  key={approval.election.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
