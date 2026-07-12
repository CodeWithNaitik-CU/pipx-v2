import { adminDb } from "@/lib/firebaseAdmin";

export async function getTournamentLeaderboard(tournamentId: string) {
  const snapshot = await adminDb.ref(`tournaments/${tournamentId}/participants`).once("value");
  const participants = snapshot.val() || {};

  const results = Object.entries(participants).map(([uid, data]: [string, any]) => {
    const currentEquity = data.currentEquity ?? data.startingBalance;
    const pnlPercent = ((currentEquity - data.startingBalance) / data.startingBalance) * 100;

    return {
      uid,
      startingBalance: data.startingBalance,
      currentEquity,
      pnlPercent,
    };
  });

  // Sort by P&L percent, descending (best trader first)
  results.sort((a, b) => b.pnlPercent - a.pnlPercent);

  // Assign ranks
  return results.map((r, index) => ({ ...r, rank: index + 1 }));
}