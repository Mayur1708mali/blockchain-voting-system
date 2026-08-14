"use client";

import { useEffect, useState } from "react";
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
  candidates: { id: string; name: string; candidateIndex: number }[];
}

export default function VoterDashboard() {
  const [elections, setElections] = useState<Election[]>([]);
  const [votedMap, setVotedMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/vote/elections");
        if (res.ok) {
          const data = await res.json();
          setElections(data);

          // Check vote status for each active election
          for (const election of data) {
            if (election.status === "ACTIVE") {
              const statusRes = await fetch(
                `/api/vote/status?electionId=${election.id}`
              );
              if (statusRes.ok) {
                const statusData = await statusRes.json();
                setVotedMap((prev) => ({
                  ...prev,
                  [election.id]: statusData.hasVoted,
                }));
              }
            }
          }
        }
      } catch (error) {
        toast.error("Failed to load elections");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-48 bg-gray-200 rounded"></div>
        <div className="h-48 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const activeElections = elections.filter((e) => e.status === "ACTIVE");
  const closedElections = elections.filter((e) => e.status === "CLOSED");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Elections</h1>
      <p className="text-gray-600 mb-8">
        View and participate in elections you&apos;ve been assigned to.
      </p>

      {elections.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <svg
            className="w-12 h-12 text-gray-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-gray-500">
            You haven&apos;t been assigned to any elections yet.
          </p>
          <p className="text-sm text-gray-400 mt-1">
            An admin will assign you to elections when they&apos;re available.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active Elections */}
          {activeElections.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Active Elections
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeElections.map((election) => (
                  <div
                    key={election.id}
                    className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {election.title}
                        </h3>
                        {election.description && (
                          <p className="text-sm text-gray-500 mt-1">
                            {election.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Ends: {new Date(election.endDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-400">
                          {election.candidates.length} candidates
                        </p>
                      </div>
                      {votedMap[election.id] ? (
                        <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Voted
                        </span>
                      ) : (
                        <Link
                          href={`/vote/${election.id}`}
                          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Vote Now
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Closed Elections */}
          {closedElections.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Closed Elections
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {closedElections.map((election) => (
                  <div
                    key={election.id}
                    className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-gray-300"
                  >
                    <h3 className="font-semibold text-gray-900">
                      {election.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-2">
                      Ended: {new Date(election.endDate).toLocaleDateString()}
                    </p>
                    <Link
                      href={`/elections/${election.id}/results`}
                      className="inline-block mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      View Results →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
