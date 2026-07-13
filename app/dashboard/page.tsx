"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import Link from "next/link";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [payingLoading, setPayingLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [tournament, setTournament] = useState<any>(null);
  const [tournamentStatus, setTournamentStatus] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        const profileRef = ref(db, `users/${currentUser.uid}`);
        onValue(profileRef, (snapshot) => {
          setProfile(snapshot.val());
        });
      } else {
        router.push("/login");
      }
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!profile?.currentTournamentId || !user) return;

    const participantRef = ref(
      db,
      `tournaments/${profile.currentTournamentId}/participants/${user.uid}`
    );
    const unsubscribe = onValue(participantRef, (snapshot) => {
      setTournament(snapshot.val());
    });

    return () => unsubscribe();
  }, [profile?.currentTournamentId, user]);

  useEffect(() => {
    if (!profile?.currentTournamentId) return;

    const statusRef = ref(db, `tournaments/${profile.currentTournamentId}/status`);
    const unsubscribe = onValue(statusRef, (snapshot) => {
      setTournamentStatus(snapshot.val());
    });

    return () => unsubscribe();
  }, [profile?.currentTournamentId]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const handleJoinTournament = async () => {
    if (!user) return;
    setPayingLoading(true);

    try {
      const res = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid, email: user.email }),
      });

      const data = await res.json();

      if (data.invoiceUrl) {
        window.location.href = data.invoiceUrl;
      } else {
        alert("Something went wrong creating the payment. Please try again.");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
    } finally {
      setPayingLoading(false);
    }
  };

  const handleDevJoinFree = async () => {
    if (!user) return;
    setPayingLoading(true);

    try {
      const res = await fetch("/api/dev-join-tournament", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          devSecret: process.env.NEXT_PUBLIC_DEV_BYPASS_SECRET,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Joined tournament for free (dev mode)!");
        window.location.reload();
      } else {
        alert(data.error || "Failed to join.");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setPayingLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-[#0A0E14] flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-gray-700 border-t-[#0066FF] rounded-full animate-spin" />
      </main>
    );
  }

  const equity = tournament?.currentEquity ?? null;
  const startingBalance = tournament?.startingBalance ?? 1000;
  const pnl = equity !== null ? equity - startingBalance : 0;
  const pnlPercent = equity !== null ? (pnl / startingBalance) * 100 : 0;
  const isProfit = pnl >= 0;

  return (
    <main className="min-h-screen bg-[#0A0E14] text-[#F5F7FA] font-sans">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Pip<span className="text-[#0066FF]">X</span>
        </h1>
        <div className="flex items-center gap-5">
          <span className="text-sm text-gray-500 hidden sm:inline">{user?.email}</span>
          <Link href="/settings" className="text-sm text-gray-400 hover:text-white transition">
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-white transition"
          >
            Log out
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Greeting */}
        <div className="mb-8">
          <h2 className="font-display text-3xl font-bold mb-1">
            Welcome back{profile?.username ? `, ${profile.username}` : ""}
          </h2>
          <p className="text-gray-500 text-sm">
            Trade live markets, climb the leaderboard, win real prizes.
          </p>
        </div>

        {!profile?.walletAddress && (
          <div className="bg-[#FFB800]/10 border border-[#FFB800]/30 rounded-xl px-5 py-3 mb-6 flex items-center justify-between">
            <p className="text-sm text-[#FFB800]">
              Add your wallet address to receive prize payouts.
            </p>
            <Link href="/settings" className="text-xs font-semibold text-[#FFB800] hover:underline">
              Add now →
            </Link>
          </div>
        )}

        {profile?.currentTournamentId && tournamentStatus === "active" ? (
          <>
            {/* Equity hero card */}
            <div className="bg-[#10151D] border border-[#1D2530] rounded-2xl p-8 mb-6">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div>
                  <p className="font-mono-num text-xs text-[#16E39B] mb-3 tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#16E39B] animate-pulse" />
                    ACTIVE TOURNAMENT
                  </p>
                  <p className="text-gray-500 text-sm mb-1">Current Equity</p>
                  <p className="font-mono-num text-5xl font-bold">
                    {equity !== null ? `$${equity.toFixed(2)}` : "..."}
                  </p>
                  {equity !== null && (
                    <p
                      className={`font-mono-num text-sm font-semibold mt-2 ${
                        isProfit ? "text-[#16E39B]" : "text-[#FF4757]"
                      }`}
                    >
                      {isProfit ? "+" : ""}${pnl.toFixed(2)} ({isProfit ? "+" : ""}
                      {pnlPercent.toFixed(2)}%)
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <Link
                    href="/trade"
                    className="bg-[#16E39B] hover:bg-[#12C588] text-black font-semibold px-6 py-3 rounded-full transition text-center"
                  >
                    Start Trading
                  </Link>
                  <Link
                    href="/leaderboard"
                    className="border border-gray-700 hover:border-gray-500 font-semibold px-6 py-3 rounded-full transition text-center"
                  >
                    Leaderboard
                  </Link>
                </div>
              </div>
            </div>

            {/* Quick stats row */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-[#10151D] border border-[#1D2530] rounded-xl p-5">
                <p className="text-gray-500 text-xs mb-1">Starting Balance</p>
                <p className="font-mono-num text-lg font-bold">${startingBalance.toFixed(2)}</p>
              </div>
              <div className="bg-[#10151D] border border-[#1D2530] rounded-xl p-5">
                <p className="text-gray-500 text-xs mb-1">Rank</p>
                <p className="font-mono-num text-lg font-bold">
                  {tournament?.rank ? `#${tournament.rank}` : "—"}
                </p>
              </div>
              <div className="bg-[#10151D] border border-[#1D2530] rounded-xl p-5 col-span-2 md:col-span-1">
                <p className="text-gray-500 text-xs mb-1">Tournament</p>
                <p className="font-mono-num text-sm font-bold truncate">
                  {profile.currentTournamentId}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-[#10151D] border border-[#1D2530] rounded-2xl p-10 text-center">
            <div className="inline-flex items-center gap-2 font-mono-num text-xs text-gray-500 border border-gray-700 rounded-full px-4 py-1.5 mb-6">
              {tournamentStatus === "completed" ? "Tournament ended" : "No active tournament"}
            </div>
            <h3 className="font-display text-2xl font-bold mb-2">
              Ready to prove your skill?
            </h3>
            <p className="text-gray-400 text-sm mb-8 max-w-sm mx-auto">
              Join this week's tournament to get your $1,000 virtual balance and start trading live markets.
            </p>
            <button
              onClick={handleJoinTournament}
              disabled={payingLoading}
              className="bg-[#0066FF] hover:bg-[#0052CC] disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold px-8 py-3.5 rounded-full transition"
            >
              {payingLoading ? "Redirecting..." : "Join Tournament"}
            </button>

            <button
              onClick={handleDevJoinFree}
              disabled={payingLoading}
              className="mt-4 block mx-auto text-xs text-gray-700 hover:text-gray-500 transition"
            >
              [Dev only] Join free — skip payment
            </button>
          </div>
        )}
      </div>
    </main>
  );
}