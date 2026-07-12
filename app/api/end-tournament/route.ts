import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getTournamentLeaderboard } from "@/lib/leaderboard";

export async function POST(req: NextRequest) {
  try {
    const { email, tournamentId } = await req.json();

    if (!email || email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!tournamentId) {
      return NextResponse.json({ error: "Missing tournamentId" }, { status: 400 });
    }

    const tournamentRef = adminDb.ref(`tournaments/${tournamentId}`);
    const snapshot = await tournamentRef.once("value");
    const tournament = snapshot.val();

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    if (tournament.status === "completed") {
      return NextResponse.json({ error: "Tournament already completed" }, { status: 400 });
    }

    // Get final leaderboard rankings
    const leaderboard = await getTournamentLeaderboard(tournamentId);
    const topWinners = leaderboard.slice(0, 5); // Top 5 winners

    // Simple prize distribution: 1st gets 40%, 2nd 25%, 3rd 15%, 4th 12%, 5th 8%
    const payoutPercentages = [0.4, 0.25, 0.15, 0.12, 0.08];
    const prizePool = tournament.prizePool || 0;

    const winners: Record<string, any> = {};
    topWinners.forEach((entry, index) => {
      winners[index + 1] = {
        uid: entry.uid,
        finalEquity: entry.currentEquity,
        pnlPercent: entry.pnlPercent,
        prize: Math.round(prizePool * (payoutPercentages[index] || 0) * 100) / 100,
      };
    });

    await tournamentRef.update({
      status: "completed",
      completedAt: Date.now(),
      winners,
    });

    return NextResponse.json({ success: true, winners });
  } catch (error) {
    console.error("End tournament error:", error);
    return NextResponse.json({ error: "Failed to end tournament" }, { status: 500 });
  }
}