import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { electionSchema } from "@/lib/validations";

// GET: List all elections
export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (!["SUPER_ADMIN", "ELECTION_MANAGER", "AUDITOR"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const elections = await prisma.election.findMany({
      include: {
        candidates: true,
        createdBy: { select: { name: true, email: true } },
        _count: { select: { voterApprovals: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(elections);
  } catch (error) {
    console.error("Elections list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create a new election
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (!["SUPER_ADMIN", "ELECTION_MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validation = electionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { title, description, type, startDate, endDate, candidates } =
      validation.data;

    const election = await prisma.election.create({
      data: {
        title,
        description,
        type: type as any,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        createdById: session.user.id,
        candidates: {
          create: candidates.map((c, index) => ({
            name: c.name,
            description: c.description || null,
            candidateIndex: index,
          })),
        },
      },
      include: {
        candidates: true,
      },
    });

    return NextResponse.json(election, { status: 201 });
  } catch (error) {
    console.error("Create election error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
