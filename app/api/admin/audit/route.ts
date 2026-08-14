import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getContract, getProvider } from "@/lib/blockchain";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (!["SUPER_ADMIN", "AUDITOR"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const electionId = searchParams.get("electionId");

    const provider = getProvider();
    const contract = getContract(provider);

    // Query events from the contract
    const events: any[] = [];

    // Get all VoteCast events
    const voteCastFilter = contract.filters.VoteCast();
    const voteCastEvents = await contract.queryFilter(voteCastFilter);

    for (const event of voteCastEvents) {
      const parsed = contract.interface.parseLog({
        topics: event.topics as string[],
        data: event.data,
      });
      if (parsed) {
        const block = await event.getBlock();
        events.push({
          type: "VoteCast",
          electionId: Number(parsed.args[0]),
          voter: parsed.args[1],
          candidateIndex: Number(parsed.args[2]),
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
          timestamp: new Date(block.timestamp * 1000).toISOString(),
        });
      }
    }

    // Get all ElectionCreated events
    const createdFilter = contract.filters.ElectionCreated();
    const createdEvents = await contract.queryFilter(createdFilter);

    for (const event of createdEvents) {
      const parsed = contract.interface.parseLog({
        topics: event.topics as string[],
        data: event.data,
      });
      if (parsed) {
        const block = await event.getBlock();
        events.push({
          type: "ElectionCreated",
          electionId: Number(parsed.args[0]),
          candidateCount: Number(parsed.args[1]),
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
          timestamp: new Date(block.timestamp * 1000).toISOString(),
        });
      }
    }

    // Get all ElectionClosed events
    const closedFilter = contract.filters.ElectionClosed();
    const closedEvents = await contract.queryFilter(closedFilter);

    for (const event of closedEvents) {
      const parsed = contract.interface.parseLog({
        topics: event.topics as string[],
        data: event.data,
      });
      if (parsed) {
        const block = await event.getBlock();
        events.push({
          type: "ElectionClosed",
          electionId: Number(parsed.args[0]),
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
          timestamp: new Date(block.timestamp * 1000).toISOString(),
        });
      }
    }

    // Sort by block number descending
    events.sort((a, b) => b.blockNumber - a.blockNumber);

    // Filter by election if specified
    let filteredEvents = events;
    if (electionId) {
      const election = await prisma.election.findUnique({
        where: { id: electionId },
      });
      if (election?.onChainId) {
        filteredEvents = events.filter(
          (e) => e.electionId === election.onChainId
        );
      }
    }

    return NextResponse.json({
      events: filteredEvents,
      totalEvents: filteredEvents.length,
    });
  } catch (error: any) {
    console.error("Audit log error:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit log. Is the blockchain running?" },
      { status: 500 }
    );
  }
}
