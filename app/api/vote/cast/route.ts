import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { voteSchema } from "@/lib/validations";
import { getContract, getVoterWallet } from "@/lib/blockchain";
import { decrypt } from "@/lib/encryption";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role;
  const approved = (session.user as any).approved;

  if (role !== "VOTER" || !approved) {
    return NextResponse.json(
      { error: "Only approved voters can cast votes" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const validation = voteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { electionId, candidateIndex } = validation.data;

    // Verify election exists and is active
    const election = await prisma.election.findUnique({
      where: { id: electionId },
      include: { candidates: true },
    });

    if (!election) {
      return NextResponse.json(
        { error: "Election not found" },
        { status: 404 }
      );
    }

    if (election.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Election is not active" },
        { status: 400 }
      );
    }

    if (!election.onChainId) {
      return NextResponse.json(
        { error: "Election is not registered on blockchain" },
        { status: 400 }
      );
    }

    // Verify voter is approved for this election
    const voterApproval = await prisma.voterApproval.findUnique({
      where: {
        userId_electionId: {
          userId: session.user.id,
          electionId,
        },
      },
    });

    if (!voterApproval) {
      return NextResponse.json(
        { error: "You are not assigned to this election" },
        { status: 403 }
      );
    }

    // Get voter's wallet
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user?.walletPrivateKey) {
      return NextResponse.json(
        { error: "Wallet not configured. Contact admin." },
        { status: 500 }
      );
    }

    // Decrypt private key and create wallet
    const privateKey = decrypt(user.walletPrivateKey);
    const voterWallet = getVoterWallet(privateKey);

    // Check if already voted on-chain
    const contract = getContract(voterWallet);
    const alreadyVoted = await contract.checkHasVoted(
      election.onChainId,
      voterWallet.address
    );

    if (alreadyVoted) {
      return NextResponse.json(
        { error: "You have already voted in this election" },
        { status: 400 }
      );
    }

    // Validate candidate index
    if (candidateIndex >= election.candidates.length) {
      return NextResponse.json(
        { error: "Invalid candidate selection" },
        { status: 400 }
      );
    }

    // Cast vote on blockchain
    const tx = await contract.castVote(election.onChainId, candidateIndex);
    const receipt = await tx.wait();

    return NextResponse.json({
      message: "Vote cast successfully!",
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
    });
  } catch (error: any) {
    console.error("Vote casting error:", error);

    // Handle specific blockchain errors
    if (error.message?.includes("already voted")) {
      return NextResponse.json(
        { error: "You have already voted in this election" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to cast vote. Please try again." },
      { status: 500 }
    );
  }
}
