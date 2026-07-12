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
        body: JSON.stringify({ uid: user.uid, email: user.email }),
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
      <main className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-gray-700 border-t-[#0066FF] rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0E1A]">
      {/* Top Nav */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">
          Pip<span className="text-[#0066FF]">X</span>
        </h1>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-white transition"
        >
          Log out
        </button>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-semibold text-white mb-2">
          Welcome, {user?.email}
        </h2>
        <p className="text-gray-400 mb-8">
          Your PipX dashboard. Trade live prices with your virtual balance and climb the leaderboard.
        </p>

        {profile?.currentTournamentId ? (
          <div className="bg-[#10151D] border border-[#16E39B]/30 rounded-2xl p-8 text-center">
            <h3 className="font-display text-xl font-bold mb-2 text-[#16E39B]">
              You're in this week's tournament
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              Start trading now with your $1,000 virtual balance.
            </p>
            <Link
              href="/trade"
              className="bg-[#16E39B] hover:bg-[#12C588] text-black font-semibold px-8 py-3 rounded-full transition inline-block"
            >
              Start Trading
            </Link>
          </div>
        ) : (
          <div className="bg-[#10151D] border border-[#1D2530] rounded-2xl p-8 text-center">
            <h3 className="font-display text-xl font-bold mb-2">
              No active tournament
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              Join this week's tournament to get your virtual balance and start trading.
            </p>
            <button
              onClick={handleJoinTournament}
              disabled={payingLoading}
              className="bg-[#0066FF] hover:bg-[#0052CC] disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-full transition"
            >
              {payingLoading ? "Redirecting..." : "Join Tournament"}
            </button>

            <button
              onClick={handleDevJoinFree}
              disabled={payingLoading}
              className="mt-3 block mx-auto text-xs text-gray-600 hover:text-gray-400 transition"
            >
              [Dev only] Join free — skip payment
            </button>
          </div>
        )}

        <Link
          href="/leaderboard"
          className="block mt-4 text-center text-sm text-gray-400 hover:text-white transition"
        >
          View live leaderboard →
        </Link>
      </div>
    </main>
  );
}