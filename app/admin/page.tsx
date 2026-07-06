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

interface AdminUser {
  uid: string;
  email: string;
  username: string;
  currentTournamentId: string | null;
  hasMT5: boolean;
  createdAt: number;
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"tournaments" | "users">("tournaments");
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
      const res = await fetch(`/api/admin/overview?email=${encodeURIComponent(email)}`);
      const data = await res.json();

      if (res.status === 403) {
        setAuthorized(false);
      } else {
        setAuthorized(true);
        setTournaments(data.tournaments || []);
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Failed to load admin data:", error);
    } finally {
      setLoading(false);
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

  return (
    <main className="min-h-screen bg-[#0A0E14] text-[#F5F7FA] font-sans">
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <Link href="/dashboard" className="font-display text-2xl font-bold tracking-tight">
          Pip<span className="text-[#0066FF]">X</span> <span className="text-gray-500 text-base">Admin</span>
        </Link>
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition">
          ← Back to Dashboard
        </Link>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-[#1D2530]">
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
        </div>

        {tab === "tournaments" && (
          <div className="bg-[#10151D] border border-[#1D2530] rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[1fr_100px_100px_100px_140px] gap-4 px-6 py-3 border-b border-[#1D2530] text-gray-500 text-xs font-mono-num">
              <span>NAME</span>
              <span>STATUS</span>
              <span className="text-right">PLAYERS</span>
              <span className="text-right">POOL</span>
              <span className="text-right">DATES</span>
            </div>
            {tournaments.length === 0 ? (
              <p className="px-6 py-10 text-center text-gray-500">No tournaments yet.</p>
            ) : (
              tournaments.map((t) => (
                <div
                  key={t.id}
                  className="grid grid-cols-[1fr_100px_100px_100px_140px] gap-4 px-6 py-4 border-b border-[#1D2530] last:border-0 items-center text-sm"
                >
                  <span className="text-gray-200">{t.name}</span>
                  <span
                    className={`text-xs font-mono-num px-2 py-1 rounded-full w-fit ${
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
                </div>
              ))
            )}
          </div>
        )}

        {tab === "users" && (
          <div className="bg-[#10151D] border border-[#1D2530] rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[1fr_140px_120px_120px] gap-4 px-6 py-3 border-b border-[#1D2530] text-gray-500 text-xs font-mono-num">
              <span>EMAIL</span>
              <span>TOURNAMENT</span>
              <span>MT5</span>
              <span className="text-right">JOINED</span>
            </div>
            {users.length === 0 ? (
              <p className="px-6 py-10 text-center text-gray-500">No users yet.</p>
            ) : (
              users.map((u) => (
                <div
                  key={u.uid}
                  className="grid grid-cols-[1fr_140px_120px_120px] gap-4 px-6 py-4 border-b border-[#1D2530] last:border-0 items-center text-sm"
                >
                  <span className="text-gray-200">{u.email}</span>
                  <span className="text-xs text-gray-400 font-mono-num">
                    {u.currentTournamentId || "—"}
                  </span>
                  <span
                    className={`text-xs font-mono-num px-2 py-1 rounded-full w-fit ${
                      u.hasMT5 ? "bg-[#16E39B]/10 text-[#16E39B]" : "bg-gray-700/30 text-gray-400"
                    }`}
                  >
                    {u.hasMT5 ? "Active" : "None"}
                  </span>
                  <span className="text-right text-xs text-gray-500">{formatDate(u.createdAt)}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}