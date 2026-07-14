"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err: any) {
      if (err.message.includes("user-not-found")) {
        // Don't reveal whether the email exists, for security — show success anyway
        setSent(true);
      } else if (err.message.includes("invalid-email")) {
        setError("Please enter a valid email address.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0A0E14] flex items-center justify-center px-4 font-sans relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#0066FF]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative">
        <Link href="/" className="block text-center mb-8">
          <h1 className="font-display text-4xl font-bold tracking-tight text-white">
            Pip<span className="text-[#0066FF]">X</span>
          </h1>
        </Link>

        <div className="bg-[#10151D] border border-[#1D2530] rounded-2xl p-8 shadow-2xl shadow-black/40">
          {sent ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#16E39B]/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✓</span>
              </div>
              <h2 className="font-display text-xl font-bold text-white mb-2">Check your email</h2>
              <p className="text-gray-400 text-sm mb-6">
                If an account exists for <span className="text-gray-300">{email}</span>, we've sent
                a password reset link.
              </p>
              <Link
                href="/login"
                className="text-[#0066FF] hover:text-[#3385FF] font-medium text-sm"
              >
                ← Back to login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-display text-xl font-bold text-white mb-2">Reset your password</h2>
              <p className="text-gray-500 text-sm mb-6">
                Enter your email and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
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
                  className="w-full bg-[#0066FF] hover:bg-[#0052CC] disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>

              <p className="text-center text-gray-500 text-sm mt-6">
                Remember your password?{" "}
                <Link href="/login" className="text-[#0066FF] hover:text-[#3385FF] font-medium">
                  Log in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}