"use client";

import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { ref, set, serverTimestamp } from "firebase/database";
import { auth, db } from "@/lib/firebase";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await set(ref(db, `users/${user.uid}`), {
        uid: user.uid,
        email: user.email,
        username: "",
        createdAt: serverTimestamp(),
        walletAddress: "",
        currentTournamentId: null,
        stats: {
          tournamentsEntered: 0,
          tournamentsWon: 0,
          bestRank: null,
        },
      });

      await sendEmailVerification(user);

      router.push("/dashboard");
    } catch (err: any) {
      setError(formatFirebaseError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const formatFirebaseError = (msg: string) => {
    if (msg.includes("email-already-in-use")) return "This email is already registered.";
    if (msg.includes("weak-password")) return "Password must be at least 6 characters.";
    if (msg.includes("invalid-email")) return "Please enter a valid email address.";
    return "Something went wrong. Please try again.";
  };

  return (
    <main className="min-h-screen bg-[#0A0E14] flex items-center justify-center px-4 font-sans relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#0066FF]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative">
        {/* Logo/Brand */}
        <Link href="/" className="block text-center mb-8">
          <h1 className="font-display text-4xl font-bold tracking-tight text-white">
            Pip<span className="text-[#0066FF]">X</span>
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            Join the global trading championship
          </p>
        </Link>

        {/* Card */}
        <div className="bg-[#10151D] border border-[#1D2530] rounded-2xl p-8 shadow-2xl shadow-black/40">
          <h2 className="font-display text-xl font-bold text-white mb-6">Create your account</h2>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-[#0A0E14] border border-[#1D2530] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Password
              </label>
              <input
                type="password"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2.5 bg-[#0A0E14] border border-[#1D2530] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2.5 bg-[#0A0E14] border border-[#1D2530] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition"
              />
            </div>

            {error && (
              <div className="bg-[#FF4757]/10 border border-[#FF4757]/30 rounded-lg px-4 py-2.5">
                <p className="text-[#FF4757] text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0066FF] hover:bg-[#0052CC] disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-[#0066FF] hover:text-[#3385FF] font-medium">
              Log in
            </Link>
          </p>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          By signing up, you agree to PipX's{" "}
          <Link href="/terms" className="text-gray-500 hover:text-gray-300 underline">
            Terms & Conditions
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-gray-500 hover:text-gray-300 underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </main>
  );
}