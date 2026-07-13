"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { ref, onValue, update } from "firebase/database";
import Link from "next/link";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }
      setUser(currentUser);

      const profileRef = ref(db, `users/${currentUser.uid}`);
      onValue(profileRef, (snapshot) => {
        const data = snapshot.val();
        setProfile(data);
        setUsername(data?.username || "");
        setWalletAddress(data?.walletAddress || "");
      });
    });

    return () => unsubscribe();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaved(false);

    try {
      await update(ref(db, `users/${user.uid}`), {
        username: username.trim(),
        walletAddress: walletAddress.trim(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <main className="min-h-screen bg-[#0A0E14] flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-gray-700 border-t-[#0066FF] rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0E14] text-[#F5F7FA] font-sans">
      <nav className="flex items-center justify-between px-6 py-5 max-w-3xl mx-auto">
        <Link href="/dashboard" className="font-display text-2xl font-bold tracking-tight">
          Pip<span className="text-[#0066FF]">X</span>
        </Link>
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition">
          ← Back to Dashboard
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="font-display text-3xl font-bold mb-1">Settings</h1>
        <p className="text-gray-500 text-sm mb-8">Manage your profile and payout details.</p>

        <div className="bg-[#10151D] border border-[#1D2530] rounded-2xl p-6 mb-6">
          <p className="text-xs text-gray-500 mb-1">Account Email</p>
          <p className="text-gray-300">{user?.email}</p>
        </div>

        <form onSubmit={handleSave} className="bg-[#10151D] border border-[#1D2530] rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a display name"
              maxLength={20}
              className="w-full px-4 py-2.5 bg-[#0A0E14] border border-[#1D2530] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Crypto Wallet Address (USDT - TRC20)
            </label>
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="Enter your USDT TRC20 wallet address"
              className="w-full px-4 py-2.5 bg-[#0A0E14] border border-[#1D2530] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition font-mono-num text-sm"
            />
            <p className="text-xs text-gray-600 mt-2">
              This is where prize winnings will be sent if you place in the top 5. Double-check
              this address carefully — PipX is not responsible for funds sent to an incorrect
              address.
            </p>
          </div>

          {saved && (
            <div className="bg-[#16E39B]/10 border border-[#16E39B]/30 rounded-lg px-4 py-2.5">
              <p className="text-[#16E39B] text-sm">Settings saved successfully.</p>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="bg-[#0066FF] hover:bg-[#0052CC] disabled:bg-gray-700 text-white font-semibold px-6 py-2.5 rounded-lg transition"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </form>
      </div>
    </main>
  );
}