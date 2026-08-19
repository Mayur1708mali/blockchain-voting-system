import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fundWallet } from "@/lib/blockchain";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (!["SUPER_ADMIN", "ELECTION_MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, walletAddress: true, approved: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.approved || user.role !== "VOTER") {
      return NextResponse.json(
        { error: "User must be an approved voter" },
        { status: 400 }
      );
    }

    if (!user.walletAddress) {
      return NextResponse.json(
        { error: "Voter has no wallet address" },
        { status: 400 }
      );
    }

    const txHash = await fundWallet(user.walletAddress, "0.1");

    return NextResponse.json({
      message: "Wallet funded successfully",
      transactionHash: txHash,
      amount: "0.1 ETH",
    });
  } catch (error: any) {
    console.error("Fund wallet error:", error);
    return NextResponse.json(
      {
        error:
          "Failed to fund wallet. Make sure the Hardhat node is running and the admin wallet has funds.",
      },
      { status: 500 }
    );
  }
}
