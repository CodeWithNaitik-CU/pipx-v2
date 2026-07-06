import { NextRequest, NextResponse } from "next/server";
import { getTournamentLeaderboard } from "@/lib/leaderboard";
import { getCurrentTournamentId } from "@/lib/tournament";

export async function GET(req: NextRequest) {
  try {
    const tournamentId = getCurrentTournamentId();
    const leaderboard = await getTournamentLeaderboard(tournamentId);

    return NextResponse.json({ tournamentId, leaderboard });
  } catch (error) {
    console.error("Leaderboard fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}