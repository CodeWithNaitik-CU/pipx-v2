import { adminDb } from "@/lib/firebaseAdmin";
import { getXAUUSDPrice, getCryptoPrices } from "@/lib/prices";

export async function checkAndClosePositions(tournamentId: string, uid: string) {
  const positionsSnapshot = await adminDb.ref(`positions/${tournamentId}/${uid}`).once("value");
  const positions = positionsSnapshot.val() || {};

  const [xau, crypto] = await Promise.all([getXAUUSDPrice(), getCryptoPrices()]);
  const currentPrices: Record<string, number | null> = {
    XAUUSD: xau,
    BTCUSD: crypto.btc,
    ETHUSD: crypto.eth,
  };

  const closedResults: any[] = [];

  for (const [positionId, position] of Object.entries(positions) as [string, any][]) {
    if (position.status !== "open") continue;

    const currentPrice = currentPrices[position.symbol];
    if (!currentPrice) continue;

    let shouldClose = false;

    if (position.direction === "buy") {
      if (position.stopLoss && currentPrice <= position.stopLoss) shouldClose = true;
      if (position.takeProfit && currentPrice >= position.takeProfit) shouldClose = true;
    } else {
      if (position.stopLoss && currentPrice >= position.stopLoss) shouldClose = true;
      if (position.takeProfit && currentPrice <= position.takeProfit) shouldClose = true;
    }

    if (shouldClose) {
      const priceDiff =
        position.direction === "buy"
          ? currentPrice - position.entryPrice
          : position.entryPrice - currentPrice;
      const pnl = position.lots * position.contractSize * priceDiff;

      await adminDb.ref(`positions/${tournamentId}/${uid}/${positionId}`).update({
        status: "closed",
        closedAt: Date.now(),
        closePrice: currentPrice,
        pnl,
      });

      const participantRef = adminDb.ref(`tournaments/${tournamentId}/participants/${uid}`);
      const participantSnapshot = await participantRef.once("value");
      const participant = participantSnapshot.val();
      const newEquity = participant.currentEquity + pnl;
      await participantRef.update({ currentEquity: newEquity });

      closedResults.push({ positionId, pnl, reason: currentPrice });
    }
  }

  return closedResults;
}