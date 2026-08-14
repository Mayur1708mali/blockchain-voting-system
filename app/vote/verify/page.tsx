"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface VoteVerification {
  electionId: string;
  electionTitle: string;
  hasVoted: boolean;
  walletAddress: string | null;
  contractAddress: string | null;
}

export default function VerifyVotePage() {
  const [verifications, setVerifications] = useState<VoteVerification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVerifications() {
      try {
        // Get elections the voter is assigned to
        const electionsRes = await fetch("/api/vote/elections");
        if (!electionsRes.ok) return;

        const elections = await electionsRes.json();

        const results: VoteVerification[] = [];
        for (const election of elections) {
          const statusRes = await fetch(
            `/api/vote/status?electionId=${election.id}`
          );
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            results.push({
              electionId: election.id,
              electionTitle: election.title,
              hasVoted: statusData.hasVoted,
              walletAddress: statusData.walletAddress || null,
              contractAddress: election.contractAddress || null,
            });
          }
        }

        setVerifications(results);
      } catch {
        toast.error("Failed to verify votes");
      } finally {
        setLoading(false);
      }
    }
    fetchVerifications();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-48 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify My Votes</h1>
      <p className="text-gray-600 mb-8">
        Verify that your votes have been recorded on the blockchain.
      </p>

      {verifications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <p className="text-gray-500">No elections to verify.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {verifications.map((v) => (
            <div
              key={v.electionId}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {v.electionTitle}
                  </h3>
                  {v.contractAddress && (
                    <p className="text-xs font-mono text-gray-400 mt-1">
                      Contract: {v.contractAddress}
                    </p>
                  )}
                </div>
                {v.hasVoted ? (
                  <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Verified on-chain
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
                    Not voted
                  </span>
                )}
              </div>
              {v.hasVoted && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    Your vote has been cryptographically verified on the
                    Ethereum blockchain. The smart contract confirms your
                    wallet address has a recorded vote in this election.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
