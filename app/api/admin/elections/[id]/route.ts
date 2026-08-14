import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Get single election details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (!["SUPER_ADMIN", "ELECTION_MANAGER", "AUDITOR"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const election = await prisma.election.findUnique({
      where: { id },
      include: {
        candidates: { orderBy: { candidateIndex: "asc" } },
        createdBy: { select: { name: true, email: true } },
        voterApprovals: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
    });

    if (!election) {
      return NextResponse.json(
        { error: "Election not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(election);
  } catch (error) {
    console.error("Get election error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: Update election
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
    const body = await request.json();

    const election = await prisma.election.findUnique({ where: { id } });
    if (!election) {
      return NextResponse.json(
        { error: "Election not found" },
        { status: 404 }
      );
    }

    if (election.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Can only edit elections in DRAFT status" },
        { status: 400 }
      );
    }

    const updated = await prisma.election.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        type: body.type,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
      },
      include: { candidates: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update election error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
