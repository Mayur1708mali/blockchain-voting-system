import { NextResponse } from "next/server";
import { closeExpiredElections } from "@/lib/close-expired-elections";

// GET: Cron endpoint to auto-close expired elections
// Secured by CRON_SECRET header to prevent unauthorized access
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // If CRON_SECRET is set, require it for access
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await closeExpiredElections();

    return NextResponse.json({
      message: "Election auto-close check completed",
      ...result,
    });
  } catch (error: any) {
    console.error("Cron close-elections error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to close expired elections" },
      { status: 500 }
    );
  }
}
