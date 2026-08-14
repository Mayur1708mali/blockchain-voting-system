import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: List elections available to the current voter
export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get elections where voter has been approved
    const voterApprovals = await prisma.voterApproval.findMany({
      where: { userId: session.user.id, approved: true },
      include: {
        election: {
          include: {
            candidates: { orderBy: { candidateIndex: "asc" } },
            _count: { select: { voterApprovals: true } },
          },
        },
      },
    });

    const elections = voterApprovals.map((va) => va.election);

    return NextResponse.json(elections);
  } catch (error) {
    console.error("Voter elections error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
