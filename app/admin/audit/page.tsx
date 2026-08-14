"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface AuditEvent {
  type: string;
  electionId: number;
  voter?: string;
  candidateIndex?: number;
  candidateCount?: number;
  transactionHash: string;
  blockNumber: number;
  timestamp: string;
}

const eventColors: Record<string, string> = {
  VoteCast: "bg-blue-100 text-blue-700",
  ElectionCreated: "bg-green-100 text-green-700",
  ElectionClosed: "bg-red-100 text-red-700",
};

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAudit() {
      try {
        const res = await fetch("/api/admin/audit");
        if (res.ok) {
          const data = await res.json();
          setEvents(data.events);
        } else {
          const data = await res.json();
          setError(data.error);
        }
      } catch {
        setError("Failed to connect to audit service");
      } finally {
        setLoading(false);
      }
    }
    fetchAudit();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Audit Log</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <p className="text-amber-800">{error}</p>
          <p className="text-sm text-amber-600 mt-2">
            Make sure the Hardhat node is running and the contract is deployed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Blockchain Audit Log
        </h1>
        <span className="text-sm text-gray-500">
          {events.length} event{events.length !== 1 ? "s" : ""} recorded
        </span>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <p className="text-gray-500">
            No blockchain events recorded yet.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Election ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tx Hash
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Block
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {events.map((event, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        eventColors[event.type] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {event.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-600">
                    {event.electionId}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {event.type === "VoteCast" && (
                      <span>
                        Voter{" "}
                        <span className="font-mono text-xs">
                          {event.voter?.slice(0, 6)}...{event.voter?.slice(-4)}
                        </span>{" "}
                        → Candidate #{(event.candidateIndex ?? 0) + 1}
                      </span>
                    )}
                    {event.type === "ElectionCreated" && (
                      <span>{event.candidateCount} candidates</span>
                    )}
                    {event.type === "ElectionClosed" && (
                      <span>Election closed</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-gray-500">
                    {event.transactionHash.slice(0, 10)}...
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    #{event.blockNumber}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(event.timestamp).toLocaleString()}
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
