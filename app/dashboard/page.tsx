"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
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
          Your PipX dashboard is under construction. Tournaments, leaderboard, and MT5 stats will appear here.
        </p>

        <div className="bg-[#121826] border border-gray-800 rounded-2xl p-8 text-center">
          <p className="text-gray-500">🚧 More features coming as we build 🚧</p>
        </div>
      </div>
    </main>
  );
}