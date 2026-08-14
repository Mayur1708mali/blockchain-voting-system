import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (!["SUPER_ADMIN", "ELECTION_MANAGER", "AUDITOR"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // pending, approved, all

    const where: any = { role: "VOTER" };
    if (status === "pending") where.approved = false;
    if (status === "approved") where.approved = true;

    const voters = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        approved: true,
        walletAddress: true,
        createdAt: true,
        voterApprovals: {
          include: {
            election: { select: { id: true, title: true, status: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(voters);
  } catch (error) {
    console.error("Voters list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
