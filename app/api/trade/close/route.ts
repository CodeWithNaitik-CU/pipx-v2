import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getXAUUSDPrice, getCryptoPrices } from "@/lib/prices";

export async function POST(req: NextRequest) {
  try {
    const { uid, tournamentId, positionId } = await req.json();

    if (!uid || !tournamentId || !positionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const positionRef = adminDb.ref(`positions/${tournamentId}/${uid}/${positionId}`);
    const snapshot = await positionRef.once("value");
    const position = snapshot.val();

    if (!position) {
      return NextResponse.json({ error: "Position not found" }, { status: 404 });
    }

    if (position.status === "closed") {
      return NextResponse.json({ error: "Position already closed" }, { status: 400 });
    }

    // Get current live price
    let closePrice: number;
    if (position.symbol === "XAUUSD") {
      closePrice = await getXAUUSDPrice();
    } else {
      const crypto = await getCryptoPrices();
      closePrice = position.symbol === "BTCUSD" ? crypto.btc : crypto.eth;
    }

    // Calculate P&L
    const priceDiff =
      position.direction === "buy"
        ? closePrice - position.entryPrice
        : position.entryPrice - closePrice;
    const pnl = position.size * (priceDiff / position.entryPrice);

    await positionRef.update({
      status: "closed",
      closedAt: Date.now(),
      closePrice,
      pnl,
    });

    // Update the participant's equity in the tournament
    const participantRef = adminDb.ref(`tournaments/${tournamentId}/participants/${uid}`);
    const participantSnapshot = await participantRef.once("value");
    const participant = participantSnapshot.val();

    const newEquity = participant.currentEquity + pnl;
    await participantRef.update({ currentEquity: newEquity });

    return NextResponse.json({ success: true, closePrice, pnl, newEquity });
  } catch (error) {
    console.error("Close position error:", error);
    return NextResponse.json({ error: "Failed to close position" }, { status: 500 });
  }
}