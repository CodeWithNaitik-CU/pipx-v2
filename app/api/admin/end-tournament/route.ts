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

    // Force-close all open positions at current market price before finalizing
    const { getXAUUSDPrice, getCryptoPrices } = await import("@/lib/prices");
    const [xau, crypto] = await Promise.all([getXAUUSDPrice(), getCryptoPrices()]);
    const currentPrices: Record<string, number | null> = {
      XAUUSD: xau,
      BTCUSD: crypto.btc,
      ETHUSD: crypto.eth,
    };

    const participantsSnapshot = await adminDb.ref(`tournaments/${tournamentId}/participants`).once("value");
    const participants = participantsSnapshot.val() || {};

    for (const uid of Object.keys(participants)) {
      const positionsSnapshot = await adminDb.ref(`positions/${tournamentId}/${uid}`).once("value");
      const userPositions = positionsSnapshot.val() || {};

      for (const [positionId, position] of Object.entries(userPositions) as [string, any][]) {
        if (position.status !== "open") continue;

        const closePrice = currentPrices[position.symbol];
        if (!closePrice) continue;

        const priceDiff =
          position.direction === "buy"
            ? closePrice - position.entryPrice
            : position.entryPrice - closePrice;
        const pnl = position.lots * position.contractSize * priceDiff;

        await adminDb.ref(`positions/${tournamentId}/${uid}/${positionId}`).update({
          status: "closed",
          closedAt: Date.now(),
          closePrice,
          pnl,
          closedReason: "tournament_ended",
        });

        const participantRef = adminDb.ref(`tournaments/${tournamentId}/participants/${uid}`);
        const participantSnapshot = await participantRef.once("value");
        const participantData = participantSnapshot.val();
        const newEquity = participantData.currentEquity + pnl;
        await participantRef.update({ currentEquity: newEquity });
      }
    }

    // Get final leaderboard rankings (now reflects force-closed positions)
    const leaderboard = await getTournamentLeaderboard(tournamentId);
    const topWinners = leaderboard.slice(0, 5); // Top 5 winners

    // Simple prize distribution: 1st gets 40%, 2nd 25%, 3rd 15%, 4th 12%, 5th 8%
    const payoutPercentages = [0.4, 0.25, 0.15, 0.12, 0.08];
    const prizePool = tournament.prizePool || 0;

    const publicWinners: Record<string, any> = {};
    const privatePayoutDetails: Record<string, any> = {};
    const fullWinnersForResponse: Record<string, any> = {};

    for (let index = 0; index < topWinners.length; index++) {
      const entry = topWinners[index];
      const userSnapshot = await adminDb.ref(`users/${entry.uid}`).once("value");
      const userData = userSnapshot.val();
      const rank = index + 1;
      const prize = Math.round(prizePool * (payoutPercentages[index] || 0) * 100) / 100;

      // Public data — safe for any logged-in user to read (no PII)
      publicWinners[rank] = {
        uid: entry.uid,
        finalEquity: entry.currentEquity,
        pnlPercent: entry.pnlPercent,
        prize,
      };

      // Private data — only accessible via Admin SDK, never exposed to client reads
      privatePayoutDetails[rank] = {
        uid: entry.uid,
        email: userData?.email || "unknown",
        walletAddress: userData?.walletAddress || null,
        prize,
        paid: false,
      };

      // Full response sent directly to the admin's browser via this API call only
      fullWinnersForResponse[rank] = {
        uid: entry.uid,
        email: userData?.email || "unknown",
        walletAddress: userData?.walletAddress || null,
        finalEquity: entry.currentEquity,
        pnlPercent: entry.pnlPercent,
        prize,
        paid: false,
      };
    }

    await tournamentRef.update({
      status: "completed",
      completedAt: Date.now(),
      winners: publicWinners,
    });

    await adminDb.ref(`payoutDetails/${tournamentId}`).set(privatePayoutDetails);

    return NextResponse.json({ success: true, winners: fullWinnersForResponse });
  } catch (error) {
    console.error("End tournament error:", error);
    return NextResponse.json({ error: "Failed to end tournament" }, { status: 500 });
  }
}