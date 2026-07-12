import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getXAUUSDPrice, getCryptoPrices } from "@/lib/prices";

export async function POST(req: NextRequest) {
  try {
    const { uid, tournamentId, symbol, direction, size, stopLoss, takeProfit } = await req.json();

    if (!uid || !tournamentId || !symbol || !direction || !size) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (direction !== "buy" && direction !== "sell") {
      return NextResponse.json({ error: "Invalid direction" }, { status: 400 });
    }

    // Check user has enough balance
    const userSnapshot = await adminDb.ref(`tournaments/${tournamentId}/participants/${uid}`).once("value");
    const participant = userSnapshot.val();

    if (!participant) {
      return NextResponse.json({ error: "Not a participant in this tournament" }, { status: 403 });
    }

    if (size > participant.currentEquity) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    // Get current live price
    let entryPrice: number;
    if (symbol === "XAUUSD") {
      entryPrice = await getXAUUSDPrice();
    } else {
      const crypto = await getCryptoPrices();
      entryPrice = symbol === "BTCUSD" ? crypto.btc : crypto.eth;
    }

    const positionRef = adminDb.ref(`positions/${tournamentId}/${uid}`).push();

    await positionRef.set({
      symbol,
      direction,
      size,
      entryPrice,
      stopLoss: stopLoss || null,
      takeProfit: takeProfit || null,
      status: "open",
      openedAt: Date.now(),
      closedAt: null,
      closePrice: null,
      pnl: null,
    });

    return NextResponse.json({ success: true, positionId: positionRef.key, entryPrice });
  } catch (error) {
    console.error("Open position error:", error);
    return NextResponse.json({ error: "Failed to open position" }, { status: 500 });
  }
}