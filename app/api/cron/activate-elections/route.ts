import { NextResponse } from "next/server";
import { activateScheduledElections } from "@/lib/activate-scheduled-elections";

// GET: Cron endpoint to auto-activate elections whose startDate has arrived
// Secured by CRON_SECRET header to prevent unauthorized access
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // If CRON_SECRET is set, require it for access
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await activateScheduledElections();

    return NextResponse.json({
      message: "Election auto-activation check completed",
      ...result,
    });
  } catch (error: any) {
    console.error("Cron activate-elections error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to activate scheduled elections" },
      { status: 500 }
    );
  }
}
