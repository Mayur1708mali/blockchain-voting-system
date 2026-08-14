import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getContract, getProvider } from "@/lib/blockchain";

// GET: Check if voter has voted in a specific election
export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const electionId = searchParams.get("electionId");

  if (!electionId) {
    return NextResponse.json(
      { error: "electionId is required" },
      { status: 400 }
    );
  }

  try {
    const election = await prisma.election.findUnique({
      where: { id: electionId },
    });

    if (!election || !election.onChainId) {
      return NextResponse.json({ hasVoted: false });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user?.walletAddress) {
      return NextResponse.json({ hasVoted: false });
    }

    const provider = getProvider();
    const contract = getContract(provider);
    const hasVoted = await contract.checkHasVoted(
      election.onChainId,
      user.walletAddress
    );

    return NextResponse.json({ hasVoted });
  } catch (error) {
    console.error("Vote status error:", error);
    return NextResponse.json({ hasVoted: false });
  }
}
