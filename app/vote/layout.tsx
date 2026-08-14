"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function VoteLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/vote" className="text-xl font-bold text-indigo-600">
            Voting Portal
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/vote/verify"
              className="text-sm text-gray-600 hover:text-indigo-600"
            >
              Verify My Vote
            </Link>
            <span className="text-sm text-gray-500">
              {session?.user?.name}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
