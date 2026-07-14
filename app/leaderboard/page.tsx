"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Link from "next/link";

interface LeaderboardEntry {
  uid: string;
  startingBalance: number;
  currentEquity: number;
  pnlPercent: number;
  rank: number;
}

export default function LeaderboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tournamentId, setTournamentId] = useState("");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchLeaderboard();
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchLeaderboard(true);
    }, 15000);

    return () => clearInterval(interval);
  }, [user]);

  const fetchLeaderboard = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
      setTournamentId(data.tournamentId || "");
    } catch (error) {
      console.error("Failed to load leaderboard:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const maskUid = (uid: string) => {
    return `Trader-${uid.slice(-4)}`;
  };

  return (
    <main className="min-h-screen bg-[#0A0E14] text-[#F5F7FA] font-sans">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto">
        <Link href="/dashboard" className="font-display text-2xl font-bold tracking-tight">
          Pip<span className="text-[#0066FF]">X</span>
        </Link>
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition">
          ← Back to Dashboard
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="font-mono-num text-xs text-[#0066FF] mb-2 tracking-widest">
              {tournamentId || "LOADING..."}
            </p>
            <h1 className="font-display text-3xl font-bold">Live Leaderboard</h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 font-mono-num">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16E39B] animate-pulse" />
            LIVE
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <span className="w-8 h-8 border-2 border-gray-700 border-t-[#0066FF] rounded-full animate-spin" />
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="bg-[#10151D] border border-[#1D2530] rounded-2xl p-10 text-center">
            <p className="text-gray-400">No traders have joined this week's tournament yet.</p>
          </div>
        ) : (
          <div className="bg-[#10151D] border border-[#1D2530] rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[60px_1fr_120px_100px] gap-4 px-6 py-3 border-b border-[#1D2530] text-gray-500 text-xs font-mono-num">
              <span>RANK</span>
              <span>TRADER</span>
              <span className="text-right">EQUITY</span>
              <span className="text-right">P&L</span>
            </div>

            {leaderboard.map((entry) => {
              const isMe = entry.uid === user?.uid;
              const isProfit = entry.pnlPercent >= 0;

              return (
                <div
                  key={entry.uid}
                  className={`grid grid-cols-[60px_1fr_120px_100px] gap-4 px-6 py-4 border-b border-[#1D2530] last:border-0 items-center ${
                    isMe ? "bg-[#0066FF]/5" : ""
                  }`}
                >
                  <span className="font-display font-bold text-gray-400">
                    #{entry.rank}
                  </span>
                  <span className="font-mono-num text-sm text-gray-200">
                    {maskUid(entry.uid)}
                    {isMe && <span className="ml-2 text-xs text-[#0066FF]">(You)</span>}
                  </span>
                  <span className="font-mono-num text-sm text-right text-gray-300">
                    ${entry.currentEquity.toFixed(2)}
                  </span>
                  <span
                    className={`font-mono-num text-sm text-right font-semibold ${
                      isProfit ? "text-[#16E39B]" : "text-[#FF4757]"
                    }`}
                  >
                    {isProfit ? "+" : ""}
                    {entry.pnlPercent.toFixed(2)}%
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={() => fetchLeaderboard(false)}
          className="mt-6 text-sm text-gray-400 hover:text-white transition"
        >
          ↻ Refresh leaderboard
        </button>
      </div>
    </main>
  );
}