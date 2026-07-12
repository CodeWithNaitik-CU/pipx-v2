import { NextRequest, NextResponse } from "next/server";
import { checkAndClosePositions } from "@/lib/checkPositions";

export async function POST(req: NextRequest) {
  try {
    const { uid, tournamentId } = await req.json();

    if (!uid || !tournamentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const closed = await checkAndClosePositions(tournamentId, uid);

    return NextResponse.json({ success: true, closed });
  } catch (error) {
    console.error("SL/TP check error:", error);
    return NextResponse.json({ error: "Failed to check positions" }, { status: 500 });
  }
}