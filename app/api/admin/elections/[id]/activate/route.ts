import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminWallet, getContract } from "@/lib/blockchain";

// POST: Activate election - deploy to blockchain
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
      include: { candidates: true },
    });

    if (!election) {
      return NextResponse.json(
        { error: "Election not found" },
        { status: 404 }
      );
    }

    if (election.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Election must be in DRAFT status to activate" },
        { status: 400 }
      );
    }

    if (election.candidates.length < 2) {
      return NextResponse.json(
        { error: "At least 2 candidates are required" },
        { status: 400 }
      );
    }

    // Generate a unique on-chain ID from current timestamp
    const onChainId = Date.now();

    // Deploy election to blockchain
    const adminWallet = getAdminWallet();
    const contract = getContract(adminWallet);

    const electionType = election.type === "SINGLE_CHOICE" ? 0 : 1;
    const tx = await contract.createElection(
      onChainId,
      election.candidates.length,
      electionType
    );
    await tx.wait();

    // Update election in database
    const updated = await prisma.election.update({
      where: { id },
      data: {
        status: "ACTIVE",
        onChainId,
        contractAddress: await contract.getAddress(),
      },
    });

    return NextResponse.json({
      message: "Election activated and registered on blockchain",
      election: updated,
      transactionHash: tx.hash,
    });
  } catch (error: any) {
    console.error("Activate election error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to activate election" },
      { status: 500 }
    );
  }
}
