import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateVoterWallet, fundWallet } from "@/lib/blockchain";
import { encrypt } from "@/lib/encryption";

export async function PATCH(
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
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "VOTER") {
      return NextResponse.json(
        { error: "User is not a voter" },
        { status: 400 }
      );
    }

    if (user.approved) {
      return NextResponse.json(
        { error: "User is already approved" },
        { status: 400 }
      );
    }

    // Generate blockchain wallet for the voter
    const wallet = generateVoterWallet();

    // Encrypt the private key before storing
    const encryptedPrivateKey = encrypt(wallet.privateKey);

    // Fund the wallet with gas ETH
    let fundingTx = "";
    try {
      fundingTx = await fundWallet(wallet.address, "0.1");
    } catch (error) {
      // If blockchain isn't running, still approve but note the issue
      console.warn("Could not fund wallet - blockchain may not be running");
    }

    // Update user
    const updated = await prisma.user.update({
      where: { id },
      data: {
        approved: true,
        walletAddress: wallet.address,
        walletPrivateKey: encryptedPrivateKey,
      },
      select: {
        id: true,
        name: true,
        email: true,
        approved: true,
        walletAddress: true,
      },
    });

    return NextResponse.json({
      message: "Voter approved successfully",
      user: updated,
      fundingTransaction: fundingTx || "pending (blockchain not available)",
    });
  } catch (error: any) {
    console.error("Approve voter error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to approve voter" },
      { status: 500 }
    );
  }
}
