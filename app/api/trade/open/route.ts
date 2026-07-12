import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getXAUUSDPrice, getCryptoPrices } from "@/lib/prices";

const CONTRACT_SIZE: Record<string, number> = {
  XAUUSD: 100, // 1 lot = 100 oz
  BTCUSD: 1,   // 1 lot = 1 BTC
  ETHUSD: 1,   // 1 lot = 1 ETH
};

const LEVERAGE = 100;

export async function POST(req: NextRequest) {
  try {
    const { uid, tournamentId, symbol, direction, lots, stopLoss, takeProfit } = await req.json();

    if (!uid || !tournamentId || !symbol || !direction || !lots) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (direction !== "buy" && direction !== "sell") {
      return NextResponse.json({ error: "Invalid direction" }, { status: 400 });
    }

    const userSnapshot = await adminDb.ref(`tournaments/${tournamentId}/participants/${uid}`).once("value");
    const participant = userSnapshot.val();

    if (!participant) {
      return NextResponse.json({ error: "Not a participant in this tournament" }, { status: 403 });
    }

    let entryPrice: number | null;
    if (symbol === "XAUUSD") {
      entryPrice = await getXAUUSDPrice();
    } else {
      const crypto = await getCryptoPrices();
      entryPrice = symbol === "BTCUSD" ? crypto.btc : crypto.eth;
    }

    if (!entryPrice) {
      return NextResponse.json({ error: "Live price unavailable right now, please try again" }, { status: 503 });
    }

    const contractSize = CONTRACT_SIZE[symbol];
    const notionalValue = lots * contractSize * entryPrice;
    const marginRequired = notionalValue / LEVERAGE;

    if (marginRequired > participant.currentEquity) {
      return NextResponse.json(
        { error: `Insufficient balance. Requires $${marginRequired.toFixed(2)} margin.` },
        { status: 400 }
      );
    }

    const positionRef = adminDb.ref(`positions/${tournamentId}/${uid}`).push();

    await positionRef.set({
      symbol,
      direction,
      lots,
      contractSize,
      entryPrice,
      stopLoss: stopLoss || null,
      takeProfit: takeProfit || null,
      status: "open",
      openedAt: Date.now(),
      closedAt: null,
      closePrice: null,
      pnl: null,
    });

    return NextResponse.json({ success: true, positionId: positionRef.key, entryPrice, marginRequired });
  } catch (error) {
    console.error("Open position error:", error);
    return NextResponse.json({ error: "Failed to open position" }, { status: 500 });
  }
}