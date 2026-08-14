import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getContract, getProvider } from "@/lib/blockchain";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const election = await prisma.election.findUnique({
      where: { id },
      include: {
        candidates: { orderBy: { candidateIndex: "asc" } },
      },
    });

    if (!election) {
      return NextResponse.json(
        { error: "Election not found" },
        { status: 404 }
      );
    }

    if (election.status !== "CLOSED") {
      return NextResponse.json(
        {
          error: "Results are not available until the election is closed",
          status: election.status,
          endDate: election.endDate,
        },
        { status: 403 }
      );
    }

    if (!election.onChainId) {
      return NextResponse.json(
        { error: "Election not registered on blockchain" },
        { status: 500 }
      );
    }

    // Fetch results from blockchain
    const provider = getProvider();
    const contract = getContract(provider);

    const results = await contract.getResults(election.onChainId);
    const totalVotes = await contract.getTotalVotes(election.onChainId);

    // Map results to candidates
    const candidateResults = election.candidates.map((candidate, index) => ({
      name: candidate.name,
      description: candidate.description,
      votes: Number(results[index]),
      percentage:
        Number(totalVotes) > 0
          ? ((Number(results[index]) / Number(totalVotes)) * 100).toFixed(1)
          : "0",
    }));

    // Determine winner(s)
    const maxVotes = Math.max(...candidateResults.map((c) => c.votes));
    const winners = candidateResults.filter((c) => c.votes === maxVotes);

    return NextResponse.json({
      election: {
        id: election.id,
        title: election.title,
        description: election.description,
        type: election.type,
        startDate: election.startDate,
        endDate: election.endDate,
        contractAddress: election.contractAddress,
      },
      results: candidateResults,
      totalVotes: Number(totalVotes),
      winners: winners.map((w) => w.name),
    });
  } catch (error: any) {
    console.error("Results error:", error);
    return NextResponse.json(
      { error: "Failed to fetch results" },
      { status: 500 }
    );
  }
}
