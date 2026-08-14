import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    // Delete the user (rejected)
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ message: "Voter rejected and removed" });
  } catch (error) {
    console.error("Reject voter error:", error);
    return NextResponse.json(
      { error: "Failed to reject voter" },
      { status: 500 }
    );
  }
}
