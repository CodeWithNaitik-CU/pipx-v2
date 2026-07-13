"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import Link from "next/link";

const SYMBOLS = ["XAUUSD", "BTCUSD", "ETHUSD"] as const;
type Symbol = (typeof SYMBOLS)[number];

const CONTRACT_SIZE: Record<Symbol, number> = {
  XAUUSD: 100,
  BTCUSD: 1,
  ETHUSD: 1,
};

interface Position {
  id: string;
  symbol: Symbol;
  direction: "buy" | "sell";
  lots: number;
  contractSize: number;
  entryPrice: number;
  stopLoss: number | null;
  takeProfit: number | null;
  status: "open" | "closed";
  pnl: number | null;
}

export default function TradePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [prices, setPrices] = useState<Record<string, number | null>>({});
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<Symbol>("XAUUSD");
  const [lots, setLots] = useState("0.01");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [placing, setPlacing] = useState(false);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [equity, setEquity] = useState<number | null>(null);
  const [livePrices, setLivePrices] = useState<Record<string, number | null>>({});
  const [priceDirection, setPriceDirection] = useState<Record<string, "up" | "down" | null>>({});
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }
      setUser(currentUser);

      const profileRef = ref(db, `users/${currentUser.uid}`);
      onValue(profileRef, (snapshot) => setProfile(snapshot.val()));
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch("/api/prices");
        const data = await res.json();
        setPrices(data);
        setLivePrices(data);
      } catch (error) {
        console.error("Failed to fetch prices:", error);
      }
    };

    const checkSLTP = async () => {
      if (!user || !profile?.currentTournamentId) return;
      try {
        await fetch("/api/trade/check-sltp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid: user.uid,
            tournamentId: profile.currentTournamentId,
          }),
        });
      } catch (error) {
        console.error("SL/TP check failed:", error);
      }
    };

    fetchPrices();
    checkSLTP();

    const priceInterval = setInterval(fetchPrices, 15000);
    const sltpInterval = setInterval(checkSLTP, 15000);

    return () => {
      clearInterval(priceInterval);
      clearInterval(sltpInterval);
    };
  }, [user, profile?.currentTournamentId]);

  // Simulate live tick movement between real price fetches
  useEffect(() => {
    const jitterInterval = setInterval(() => {
      setLivePrices((prev) => {
        const next: Record<string, number | null> = {};
        const directions: Record<string, "up" | "down" | null> = {};
        for (const symbol of SYMBOLS) {
          const basePrice = prices[symbol];
          const current = prev[symbol];
          if (!basePrice || !current) {
            next[symbol] = basePrice;
            directions[symbol] = null;
            continue;
          }
          const move = (Math.random() - 0.5) * 2 * basePrice * 0.00015;
          let updated = current + move;
          const band = basePrice * 0.0008;
          updated = Math.max(basePrice - band, Math.min(basePrice + band, updated));
          next[symbol] = updated;
          directions[symbol] = move >= 0 ? "up" : "down";
        }
        setPriceDirection(directions);
        return next;
      });
    }, 1000);

    return () => clearInterval(jitterInterval);
  }, [prices]);

  useEffect(() => {
    if (!profile?.currentTournamentId || !user) return;

    const positionsRef = ref(db, `positions/${profile.currentTournamentId}/${user.uid}`);
    const unsubscribe = onValue(positionsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list: Position[] = Object.entries(data).map(([id, p]: [string, any]) => ({
        id,
        ...p,
      }));
      list.sort((a: any, b: any) => (b.openedAt || 0) - (a.openedAt || 0));
      setPositions(list);
    });

    return () => unsubscribe();
  }, [profile?.currentTournamentId, user]);

  useEffect(() => {
    if (!profile?.currentTournamentId || !user) return;

    const participantRef = ref(
      db,
      `tournaments/${profile.currentTournamentId}/participants/${user.uid}/currentEquity`
    );
    const unsubscribe = onValue(participantRef, (snapshot) => {
      setEquity(snapshot.val());
    });

    return () => unsubscribe();
  }, [profile?.currentTournamentId, user]);

  const handlePlaceTrade = async (direction: "buy" | "sell") => {
    if (!user || !profile?.currentTournamentId) return;
    setPlacing(true);

    try {
      const res = await fetch("/api/trade/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          tournamentId: profile.currentTournamentId,
          symbol: selectedSymbol,
          direction,
          lots: parseFloat(lots),
          stopLoss: stopLoss ? parseFloat(stopLoss) : null,
          takeProfit: takeProfit ? parseFloat(takeProfit) : null,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Failed to place trade");
      } else {
        setStopLoss("");
        setTakeProfit("");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setPlacing(false);
    }
  };

  const handleClosePosition = async (positionId: string) => {
    if (!user || !profile?.currentTournamentId) return;
    setClosingId(positionId);

    try {
      const res = await fetch("/api/trade/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          tournamentId: profile.currentTournamentId,
          positionId,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        alert(data.error || "Failed to close position");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setClosingId(null);
    }
  };

  const getLiveUnrealizedPnl = (p: Position) => {
    const currentPrice = livePrices[p.symbol];
    if (!currentPrice) return 0;
    const priceDiff =
      p.direction === "buy" ? currentPrice - p.entryPrice : p.entryPrice - currentPrice;
    return p.lots * p.contractSize * priceDiff;
  };

  const currentPrice = livePrices[selectedSymbol];
  const marginPreview =
    currentPrice && lots
      ? (parseFloat(lots) * CONTRACT_SIZE[selectedSymbol] * currentPrice) / 100
      : null;

  if (!profile?.currentTournamentId) {
    return (
      <main className="min-h-screen bg-[#0A0E14] text-[#F5F7FA] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold mb-2">No active tournament</h1>
          <p className="text-gray-400 mb-6">Join a tournament first to start trading.</p>
          <Link href="/dashboard" className="text-[#0066FF] hover:text-[#3385FF]">
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const openPositions = positions.filter((p) => p.status === "open");
  const closedPositions = positions.filter((p) => p.status === "closed");

  return (
    <main className="min-h-screen bg-[#0A0E14] text-[#F5F7FA] font-sans">
      <nav className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto">
        <Link href="/dashboard" className="font-display text-2xl font-bold tracking-tight">
          Pip<span className="text-[#0066FF]">X</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="font-mono-num text-sm text-gray-400">
            Equity: <span className="text-[#16E39B]">${equity?.toFixed(2) ?? "..."}</span>
          </span>
          <Link href="/leaderboard" className="text-sm text-gray-400 hover:text-white transition">
            Leaderboard
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Price tickers */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {SYMBOLS.map((sym) => {
            const dir = priceDirection[sym];
            return (
              <button
                key={sym}
                onClick={() => setSelectedSymbol(sym)}
                className={`p-4 rounded-xl border text-left transition relative overflow-hidden ${
                  selectedSymbol === sym
                    ? "bg-[#0066FF]/10 border-[#0066FF]"
                    : "bg-[#10151D] border-[#1D2530] hover:border-gray-600"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500 font-mono-num tracking-wide">{sym}</p>
                  {dir && (
                    <span
                      className={`text-xs font-mono-num ${
                        dir === "up" ? "text-[#16E39B]" : "text-[#FF4757]"
                      }`}
                    >
                      {dir === "up" ? "▲" : "▼"}
                    </span>
                  )}
                </div>
                <p
                  className={`font-mono-num text-lg font-bold transition-colors ${
                    dir === "up" ? "text-[#16E39B]" : dir === "down" ? "text-[#FF4757]" : "text-white"
                  }`}
                >
                  {livePrices[sym]
                    ? `$${livePrices[sym]!.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                    : "—"}
                </p>
              </button>
            );
          })}
        </div>

        {/* Trade panel */}
        <div className="bg-[#10151D] border border-[#1D2530] rounded-2xl p-6 mb-6">
          <h3 className="font-display font-bold mb-1">
            Trade {selectedSymbol} @ {currentPrice ? `$${currentPrice.toLocaleString()}` : "..."}
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            1 lot = {CONTRACT_SIZE[selectedSymbol]} {selectedSymbol === "XAUUSD" ? "oz" : "unit(s)"} · Leverage 1:100
          </p>
          <div className="grid grid-cols-3 gap-4 mb-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Lots</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={lots}
                onChange={(e) => setLots(e.target.value)}
                className="w-full px-3 py-2 bg-[#0A0E14] border border-gray-700 rounded-lg text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Stop Loss (optional)</label>
              <input
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="Price"
                className="w-full px-3 py-2 bg-[#0A0E14] border border-gray-700 rounded-lg text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Take Profit (optional)</label>
              <input
                type="number"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                placeholder="Price"
                className="w-full px-3 py-2 bg-[#0A0E14] border border-gray-700 rounded-lg text-white text-sm"
              />
            </div>
          </div>
          {marginPreview && (
            <p className="text-xs text-gray-500 mb-4">
              Margin required: <span className="text-gray-300 font-mono-num">${marginPreview.toFixed(2)}</span>
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => handlePlaceTrade("buy")}
              disabled={placing || !currentPrice}
              className="flex-1 bg-[#16E39B] hover:bg-[#12C588] disabled:bg-gray-700 text-black font-bold py-3 rounded-lg transition"
            >
              BUY
            </button>
            <button
              onClick={() => handlePlaceTrade("sell")}
              disabled={placing || !currentPrice}
              className="flex-1 bg-[#FF4757] hover:bg-[#E63E4D] disabled:bg-gray-700 text-white font-bold py-3 rounded-lg transition"
            >
              SELL
            </button>
          </div>
        </div>

        {/* Open positions */}
        <div className="mb-6">
          <h3 className="font-display font-bold mb-3">Open Positions ({openPositions.length})</h3>
          {openPositions.length === 0 ? (
            <p className="text-gray-500 text-sm">No open positions.</p>
          ) : (
            <div className="space-y-2">
              {openPositions.map((p) => {
                const unrealizedPnl = getLiveUnrealizedPnl(p);
                return (
                  <div
                    key={p.id}
                    className="bg-[#10151D] border border-[#1D2530] rounded-xl p-4 flex items-center justify-between"
                  >
                    <div>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded mr-2 ${
                          p.direction === "buy"
                            ? "bg-[#16E39B]/10 text-[#16E39B]"
                            : "bg-[#FF4757]/10 text-[#FF4757]"
                        }`}
                      >
                        {p.direction.toUpperCase()}
                      </span>
                      <span className="font-mono-num text-sm">{p.symbol}</span>
                      <span className="text-gray-500 text-xs ml-2">
                        {p.lots} lots @ ${p.entryPrice.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`font-mono-num text-sm font-semibold ${
                          unrealizedPnl >= 0 ? "text-[#16E39B]" : "text-[#FF4757]"
                        }`}
                      >
                        {unrealizedPnl >= 0 ? "+" : ""}${unrealizedPnl.toFixed(2)}
                      </span>
                      <button
                        onClick={() => handleClosePosition(p.id)}
                        disabled={closingId === p.id}
                        className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg transition"
                      >
                        {closingId === p.id ? "Closing..." : "Close"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Closed positions */}
        <div>
          <h3 className="font-display font-bold mb-3">Trade History</h3>
          {closedPositions.length === 0 ? (
            <p className="text-gray-500 text-sm">No closed trades yet.</p>
          ) : (
            <div className="space-y-2">
              {closedPositions.map((p) => (
                <div
                  key={p.id}
                  className="bg-[#10151D] border border-[#1D2530] rounded-xl p-4 flex items-center justify-between opacity-70"
                >
                  <div>
                    <span className="text-xs text-gray-500 mr-2">{p.direction.toUpperCase()}</span>
                    <span className="font-mono-num text-sm">{p.symbol}</span>
                    <span className="text-gray-500 text-xs ml-2">{p.lots} lots</span>
                  </div>
                  <span
                    className={`font-mono-num text-sm font-semibold ${
                      (p.pnl || 0) >= 0 ? "text-[#16E39B]" : "text-[#FF4757]"
                    }`}
                  >
                    {(p.pnl || 0) >= 0 ? "+" : ""}${(p.pnl || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}