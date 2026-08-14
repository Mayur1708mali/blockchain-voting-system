import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (!["SUPER_ADMIN", "ELECTION_MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { electionId } = body;

    if (!electionId) {
      return NextResponse.json(
        { error: "electionId is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.role !== "VOTER" || !user.approved) {
      return NextResponse.json(
        { error: "User must be an approved voter" },
        { status: 400 }
      );
    }

    const election = await prisma.election.findUnique({
      where: { id: electionId },
    });
    if (!election) {
      return NextResponse.json(
        { error: "Election not found" },
        { status: 404 }
      );
    }

    // Create voter approval (upsert to prevent duplicates)
    const approval = await prisma.voterApproval.upsert({
      where: {
        userId_electionId: { userId: id, electionId },
      },
      update: { approved: true },
      create: {
        userId: id,
        electionId,
        approved: true,
      },
    });

    return NextResponse.json({
      message: "Voter assigned to election",
      approval,
    });
  } catch (error) {
    console.error("Assign election error:", error);
    return NextResponse.json(
      { error: "Failed to assign voter to election" },
      { status: 500 }
    );
  }
}
