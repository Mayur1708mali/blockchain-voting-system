import { prisma } from "@/lib/prisma";
import { getAdminWallet, getContract } from "@/lib/blockchain";

export interface ActivateResult {
  activated: string[];
  failed: { id: string; error: string }[];
}

/**
 * Finds all DRAFT elections whose startDate has arrived and activates them
 * on-chain and in the database. Only elections with at least 2 candidates
 * are eligible for auto-activation.
 */
export async function activateScheduledElections(): Promise<ActivateResult> {
  const now = new Date();

  const readyElections = await prisma.election.findMany({
    where: {
      status: "DRAFT",
      startDate: { lte: now },
    },
    include: { candidates: true },
  });

  const result: ActivateResult = { activated: [], failed: [] };

  for (const election of readyElections) {
    // Skip elections without enough candidates
    if (election.candidates.length < 2) {
      result.failed.push({
        id: election.id,
        error: "At least 2 candidates are required to activate",
      });
      continue;
    }

    try {
      // Generate a unique on-chain ID (fits in 32-bit signed integer)
      const onChainId = Math.floor(Math.random() * 2_000_000_000) + 1;

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
      await prisma.election.update({
        where: { id: election.id },
        data: {
          status: "ACTIVE",
          onChainId,
          contractAddress: await contract.getAddress(),
        },
      });

      result.activated.push(election.id);
    } catch (error: any) {
      console.error(
        `Failed to auto-activate election ${election.id}:`,
        error.message
      );
      result.failed.push({ id: election.id, error: error.message });
    }
  }

  if (result.activated.length > 0) {
    console.log(
      `Auto-activated ${result.activated.length} scheduled election(s)`
    );
  }

  return result;
}
