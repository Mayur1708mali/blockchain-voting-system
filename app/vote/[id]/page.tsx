"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Candidate {
  id: string;
  name: string;
  description: string | null;
  candidateIndex: number;
}

interface Election {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  candidates: Candidate[];
}

export default function VotePage() {
  const params = useParams();
  const router = useRouter();
  const [election, setElection] = useState<Election | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    async function fetchElection() {
      try {
        const res = await fetch("/api/vote/elections");
        if (res.ok) {
          const elections = await res.json();
          const found = elections.find((e: Election) => e.id === params.id);
          if (found) {
            setElection(found);

            // Check if already voted
            const statusRes = await fetch(
              `/api/vote/status?electionId=${found.id}`
            );
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              setHasVoted(statusData.hasVoted);
            }
          } else {
            toast.error("Election not found or you don't have access");
            router.push("/vote");
          }
        }
      } catch {
        toast.error("Failed to load election");
      } finally {
        setLoading(false);
      }
    }
    fetchElection();
  }, [params.id, router]);

  const handleVote = async () => {
    if (selectedCandidate === null) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/vote/cast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          electionId: election!.id,
          candidateIndex: selectedCandidate,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Vote cast successfully!");
        router.push(
          `/vote/${election!.id}/confirm?tx=${data.transactionHash}`
        );
      } else {
        toast.error(data.error || "Failed to cast vote");
        setShowConfirm(false);
      }
    } catch {
      toast.error("An error occurred while casting your vote");
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
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

  if (hasVoted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          You Have Already Voted
        </h2>
        <p className="text-gray-600 mb-6">
          Your vote for &quot;{election.title}&quot; has been recorded on the
          blockchain.
        </p>
        <button
          onClick={() => router.push("/vote")}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (election.status !== "ACTIVE") {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Election Not Active
        </h2>
        <p className="text-gray-600">
          This election is currently {election.status.toLowerCase()}.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        {election.title}
      </h1>
      {election.description && (
        <p className="text-gray-600 mb-6">{election.description}</p>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Select Your Candidate
        </h2>
        <div className="space-y-3">
          {election.candidates.map((candidate) => (
            <label
              key={candidate.id}
              className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                selectedCandidate === candidate.candidateIndex
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="candidate"
                value={candidate.candidateIndex}
                checked={selectedCandidate === candidate.candidateIndex}
                onChange={() =>
                  setSelectedCandidate(candidate.candidateIndex)
                }
                className="w-4 h-4 text-indigo-600"
              />
              <div>
                <p className="font-medium text-gray-900">{candidate.name}</p>
                {candidate.description && (
                  <p className="text-sm text-gray-500">
                    {candidate.description}
                  </p>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={() => setShowConfirm(true)}
        disabled={selectedCandidate === null}
        className="w-full py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Cast My Vote
      </button>

      <p className="text-center text-sm text-gray-500 mt-3">
        Your vote will be permanently recorded on the blockchain and cannot be changed.
      </p>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Confirm Your Vote
            </h2>
            <p className="text-gray-600 mb-4">
              You are voting for{" "}
              <strong>
                {election.candidates.find(
                  (c) => c.candidateIndex === selectedCandidate
                )?.name}
              </strong>{" "}
              in &quot;{election.title}&quot;.
            </p>
            <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg mb-4">
              This action cannot be undone. Your vote will be permanently
              recorded on the blockchain.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleVote}
                disabled={submitting}
                className="flex-1 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? "Submitting..." : "Confirm Vote"}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
