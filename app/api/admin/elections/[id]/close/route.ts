import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminWallet, getContract } from "@/lib/blockchain";

// POST: Close election on blockchain
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
    const election = await prisma.election.findUnique({
      where: { id },
    });

    if (!election) {
      return NextResponse.json(
        { error: "Election not found" },
        { status: 404 }
      );
    }

    if (election.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Election must be ACTIVE to close" },
        { status: 400 }
      );
    }

    if (!election.onChainId) {
      return NextResponse.json(
        { error: "Election has no on-chain ID" },
        { status: 400 }
      );
    }

    // Close election on blockchain
    const adminWallet = getAdminWallet();
    const contract = getContract(adminWallet);

    const tx = await contract.closeElection(election.onChainId);
    await tx.wait();

    // Update database
    const updated = await prisma.election.update({
      where: { id },
      data: { status: "CLOSED" },
    });

    return NextResponse.json({
      message: "Election closed successfully",
      election: updated,
      transactionHash: tx.hash,
    });
  } catch (error: any) {
    console.error("Close election error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to close election" },
      { status: 500 }
    );
  }
}
