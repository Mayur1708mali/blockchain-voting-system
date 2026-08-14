import { prisma } from "@/lib/prisma";
import { getAdminWallet, getContract } from "@/lib/blockchain";

export interface CloseResult {
  closed: string[];
  failed: { id: string; error: string }[];
}

/**
 * Finds all ACTIVE elections whose endDate has passed and closes them
 * both on-chain and in the database.
 */
export async function closeExpiredElections(): Promise<CloseResult> {
  const now = new Date();

  const expiredElections = await prisma.election.findMany({
    where: {
      status: "ACTIVE",
      endDate: { lte: now },
    },
  });

  const result: CloseResult = { closed: [], failed: [] };

  for (const election of expiredElections) {
    try {
      // Close on blockchain if it has an on-chain ID
      if (election.onChainId) {
        const adminWallet = getAdminWallet();
        const contract = getContract(adminWallet);
        const tx = await contract.closeElection(election.onChainId);
        await tx.wait();
      }

      // Update status in database
      await prisma.election.update({
        where: { id: election.id },
        data: { status: "CLOSED" },
      });

      result.closed.push(election.id);
    } catch (error: any) {
      console.error(
        `Failed to auto-close election ${election.id}:`,
        error.message
      );
      result.failed.push({ id: election.id, error: error.message });
    }
  }

  if (result.closed.length > 0) {
    console.log(`Auto-closed ${result.closed.length} expired election(s)`);
  }

  return result;
}
