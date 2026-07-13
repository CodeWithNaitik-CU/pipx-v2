"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Link from "next/link";

interface Tournament {
  id: string;
  name: string;
  status: string;
  prizePool: number;
  participantCount: number;
  startDate: number;
  endDate: number;
}

interface Winner {
  uid: string;
  email: string;
  walletAddress: string | null;
  finalEquity: number;
  pnlPercent: number;
  prize: number;
  paid: boolean;
}

interface Payout {
  tournamentId: string;
  tournamentName: string;
  rank: number;
  uid: string;
  email: string;
  walletAddress: string | null;
  prize: number;
  paid: boolean;
}

interface AdminUser {
  uid: string;
  email: string;
  username: string;
  currentTournamentId: string | null;
  createdAt: number;
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"tournaments" | "users" | "payouts">("tournaments");
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);
  const [endingId, setEndingId] = useState<string | null>(null);
  const [winnersModal, setWinnersModal] = useState<Winner[] | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }
      setUser(currentUser);
      setCheckingAuth(false);
      await fetchAdminData(currentUser.email as string);
    });

    return () => unsubscribe();
  }, [router]);

  const fetchAdminData = async (email: string) => {
    setLoading(true);
    try {
      const [overviewRes, payoutsRes] = await Promise.all([
        fetch(`/api/admin/overview?email=${encodeURIComponent(email)}`),
        fetch(`/api/admin/payouts?email=${encodeURIComponent(email)}`),
      ]);

      const data = await overviewRes.json();
      const payoutsData = await payoutsRes.json();

      if (overviewRes.status === 403) {
        setAuthorized(false);
      } else {
        setAuthorized(true);
        setTournaments(data.tournaments || []);
        setUsers(data.users || []);
        setPayouts(payoutsData.payouts || []);
      }
    } catch (error) {
      console.error("Failed to load admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEndTournament = async (tournamentId: string) => {
    if (!user?.email) return;
    if (!confirm(`End tournament "${tournamentId}" and finalize winners? This cannot be undone.`)) return;

    setEndingId(tournamentId);
    try {
      const res = await fetch("/api/admin/end-tournament", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, tournamentId }),
      });

      const data = await res.json();

      if (data.success) {
        setWinnersModal(Object.values(data.winners));
        fetchAdminData(user.email);
      } else {
        alert(data.error || "Failed to end tournament");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setEndingId(null);
    }
  };

  const handleMarkPaid = async (tournamentId: string, rank: number) => {
    if (!user?.email) return;
    setMarkingPaid(`${tournamentId}-${rank}`);

    try {
      await fetch("/api/admin/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, tournamentId, rank }),
      });
      fetchAdminData(user.email);
    } catch (error) {
      console.error(error);
      alert("Failed to update payout status");
    } finally {
      setMarkingPaid(null);
    }
  };

  const formatDate = (ts: number) => {
    if (!ts) return "—";
    return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (checkingAuth || loading) {
    return (
      <main className="min-h-screen bg-[#0A0E14] flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-gray-700 border-t-[#0066FF] rounded-full animate-spin" />
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="min-h-screen bg-[#0A0E14] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold mb-2 text-white">Access Denied</h1>
          <p className="text-gray-400 mb-6">You don't have permission to view this page.</p>
          <Link href="/dashboard" className="text-[#0066FF] hover:text-[#3385FF]">
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const activeTournaments = tournaments.filter((t) => t.status === "active").length;
  const totalPrizePool = tournaments.reduce((sum, t) => sum + (t.prizePool || 0), 0);
  const totalParticipants = tournaments.reduce((sum, t) => sum + (t.participantCount || 0), 0);

  return (
    <main className="min-h-screen bg-[#0A0E14] text-[#F5F7FA] font-sans">
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <Link href="/dashboard" className="font-display text-2xl font-bold tracking-tight">
          Pip<span className="text-[#0066FF]">X</span>{" "}
          <span className="text-gray-600 text-base font-normal">/ Command Center</span>
        </Link>
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition">
          ← Back to Dashboard
        </Link>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* KPI Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-[#10151D] border border-[#1D2530] rounded-2xl p-6">
            <p className="text-gray-500 text-xs mb-2 tracking-wide">TOTAL USERS</p>
            <p className="font-mono-num text-3xl font-bold">{users.length}</p>
          </div>
          <div className="bg-[#10151D] border border-[#1D2530] rounded-2xl p-6">
            <p className="text-gray-500 text-xs mb-2 tracking-wide">ACTIVE TOURNAMENTS</p>
            <p className="font-mono-num text-3xl font-bold text-[#16E39B]">{activeTournaments}</p>
          </div>
          <div className="bg-[#10151D] border border-[#1D2530] rounded-2xl p-6">
            <p className="text-gray-500 text-xs mb-2 tracking-wide">TOTAL PARTICIPANTS</p>
            <p className="font-mono-num text-3xl font-bold">{totalParticipants}</p>
          </div>
          <div className="bg-[#10151D] border border-[#1D2530] rounded-2xl p-6">
            <p className="text-gray-500 text-xs mb-2 tracking-wide">TOTAL PRIZE POOL</p>
            <p className="font-mono-num text-3xl font-bold text-[#FFB800]">${totalPrizePool.toFixed(0)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-[#1D2530]">
          <button
            onClick={() => setTab("tournaments")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              tab === "tournaments"
                ? "border-[#0066FF] text-white"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            Tournaments ({tournaments.length})
          </button>
          <button
            onClick={() => setTab("users")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              tab === "users"
                ? "border-[#0066FF] text-white"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setTab("payouts")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              tab === "payouts"
                ? "border-[#0066FF] text-white"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            Payouts ({payouts.filter((p) => !p.paid).length} pending)
          </button>
        </div>

        {tab === "tournaments" && (
          <div className="bg-[#10151D] border border-[#1D2530] rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[1fr_100px_90px_90px_150px_90px] gap-4 px-6 py-3 border-b border-[#1D2530] text-gray-500 text-xs font-mono-num">
              <span>NAME</span>
              <span>STATUS</span>
              <span className="text-right">PLAYERS</span>
              <span className="text-right">POOL</span>
              <span className="text-right">DATES</span>
              <span className="text-right">ACTION</span>
            </div>
            {tournaments.length === 0 ? (
              <p className="px-6 py-14 text-center text-gray-500">No tournaments yet.</p>
            ) : (
              tournaments.map((t) => (
                <div
                  key={t.id}
                  className="grid grid-cols-[1fr_100px_90px_90px_150px_90px] gap-4 px-6 py-4 border-b border-[#1D2530] last:border-0 items-center text-sm hover:bg-white/[0.02] transition"
                >
                  <div>
                    <p className="text-gray-200 font-medium">{t.name}</p>
                    <p className="text-gray-600 text-xs font-mono-num">{t.id}</p>
                  </div>
                  <span
                    className={`text-xs font-mono-num px-2.5 py-1 rounded-full w-fit ${
                      t.status === "active"
                        ? "bg-[#16E39B]/10 text-[#16E39B]"
                        : "bg-gray-700/30 text-gray-400"
                    }`}
                  >
                    {t.status}
                  </span>
                  <span className="text-right font-mono-num text-gray-300">{t.participantCount}</span>
                  <span className="text-right font-mono-num text-[#FFB800]">${t.prizePool}</span>
                  <span className="text-right text-xs text-gray-500">
                    {formatDate(t.startDate)} – {formatDate(t.endDate)}
                  </span>
                  <span className="text-right">
                    {t.status === "active" ? (
                      <button
                        onClick={() => handleEndTournament(t.id)}
                        disabled={endingId === t.id}
                        className="text-xs bg-[#FF4757]/10 text-[#FF4757] hover:bg-[#FF4757]/20 px-3 py-1.5 rounded-lg transition font-medium"
                      >
                        {endingId === t.id ? "Ending..." : "End"}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-700">—</span>
                    )}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "users" && (
          <div className="bg-[#10151D] border border-[#1D2530] rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[1fr_180px_140px] gap-4 px-6 py-3 border-b border-[#1D2530] text-gray-500 text-xs font-mono-num">
              <span>EMAIL</span>
              <span>TOURNAMENT</span>
              <span className="text-right">JOINED</span>
            </div>
            {users.length === 0 ? (
              <p className="px-6 py-14 text-center text-gray-500">No users yet.</p>
            ) : (
              users.map((u) => (
                <div
                  key={u.uid}
                  className="grid grid-cols-[1fr_180px_140px] gap-4 px-6 py-4 border-b border-[#1D2530] last:border-0 items-center text-sm hover:bg-white/[0.02] transition"
                >
                  <span className="text-gray-200">{u.email}</span>
                  <span
                    className={`text-xs font-mono-num px-2.5 py-1 rounded-full w-fit ${
                      u.currentTournamentId
                        ? "bg-[#0066FF]/10 text-[#0066FF]"
                        : "bg-gray-700/30 text-gray-500"
                    }`}
                  >
                    {u.currentTournamentId || "Not enrolled"}
                  </span>
                  <span className="text-right text-xs text-gray-500">{formatDate(u.createdAt)}</span>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "payouts" && (
          <div className="bg-[#10151D] border border-[#1D2530] rounded-2xl overflow-hidden">
            {payouts.length === 0 ? (
              <p className="px-6 py-14 text-center text-gray-500">No payouts yet.</p>
            ) : (
              payouts.map((p) => (
                <div
                  key={`${p.tournamentId}-${p.rank}`}
                  className={`px-6 py-4 border-b border-[#1D2530] last:border-0 ${
                    p.paid ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3">
                      <span className="font-display font-bold text-sm">#{p.rank}</span>
                      <span className="text-sm text-gray-300">{p.email}</span>
                      <span className="text-xs text-gray-600 font-mono-num">{p.tournamentId}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono-num text-sm text-[#FFB800] font-bold">
                        ${p.prize.toFixed(2)}
                      </span>
                      {p.paid ? (
                        <span className="text-xs bg-[#16E39B]/10 text-[#16E39B] px-2.5 py-1 rounded-full">
                          Paid
                        </span>
                      ) : (
                        <button
                          onClick={() => handleMarkPaid(p.tournamentId, p.rank)}
                          disabled={markingPaid === `${p.tournamentId}-${p.rank}`}
                          className="text-xs bg-[#0066FF]/10 text-[#0066FF] hover:bg-[#0066FF]/20 px-3 py-1 rounded-full transition"
                        >
                          {markingPaid === `${p.tournamentId}-${p.rank}` ? "..." : "Mark Paid"}
                        </button>
                      )}
                    </div>
                  </div>
                  {p.walletAddress ? (
                    <p className="font-mono-num text-xs text-gray-500 break-all">{p.walletAddress}</p>
                  ) : (
                    <p className="text-xs text-[#FF4757]">⚠ No wallet address on file</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {winnersModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#10151D] border border-[#1D2530] rounded-2xl p-6 max-w-md w-full">
            <h3 className="font-display text-xl font-bold mb-4">🏆 Tournament Winners</h3>
            <div className="space-y-3 mb-4">
              {winnersModal.map((w, i) => (
                <div key={w.uid} className="bg-[#0A0E14] rounded-lg px-4 py-3">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm text-gray-300">
                      #{i + 1} — {w.email}
                    </span>
                    <span className="font-mono-num text-sm text-[#FFB800] font-bold">
                      ${w.prize.toFixed(2)}
                    </span>
                  </div>
                  {w.walletAddress ? (
                    <p className="font-mono-num text-xs text-gray-500 break-all">
                      {w.walletAddress}
                    </p>
                  ) : (
                    <p className="text-xs text-[#FF4757]">
                      ⚠ No wallet address on file — contact this user before paying out.
                    </p>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Remember to manually send these crypto payouts to each winner's wallet address.
            </p>
            <button
              onClick={() => setWinnersModal(null)}
              className="w-full bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold py-2.5 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}