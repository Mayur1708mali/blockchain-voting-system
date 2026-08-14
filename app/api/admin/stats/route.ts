import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (!["SUPER_ADMIN", "ELECTION_MANAGER", "AUDITOR"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const [totalElections, activeElections, totalVoters, pendingApprovals] =
      await Promise.all([
        prisma.election.count(),
        prisma.election.count({ where: { status: "ACTIVE" } }),
        prisma.user.count({ where: { role: "VOTER" } }),
        prisma.user.count({ where: { role: "VOTER", approved: false } }),
      ]);

    return NextResponse.json({
      totalElections,
      activeElections,
      totalVoters,
      pendingApprovals,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
