"use client";

import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function VoteConfirmationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const txHash = searchParams.get("tx");

  return (
    <div className="max-w-2xl mx-auto text-center py-12">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg
          className="w-10 h-10 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-3">
        Vote Cast Successfully!
      </h1>
      <p className="text-gray-600 mb-8">
        Your vote has been permanently recorded on the Ethereum blockchain.
        It cannot be altered or deleted.
      </p>

      {txHash && (
        <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
          <h2 className="text-sm font-medium text-gray-500 mb-2">
            Transaction Hash
          </h2>
          <p className="font-mono text-sm text-gray-800 break-all">{txHash}</p>
          <p className="text-xs text-gray-400 mt-2">
            Save this hash to verify your vote later.
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/vote"
          className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Back to Dashboard
        </Link>
        <Link
          href="/vote/verify"
          className="px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
        >
          Verify My Vote
        </Link>
      </div>
    </div>
  );
}
