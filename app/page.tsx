import Link from "next/link";

const podium = [
  { rank: 2, name: "trader_akash", badge: "SILVER", color: "border-gray-400" },
  { rank: 1, name: "fx_neha", badge: "GOLD", color: "border-[#FFB800]" },
  { rank: 3, name: "pip_hunter", badge: "BRONZE", color: "border-[#B87333]" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0A0E14] text-[#F5F7FA] font-sans overflow-x-hidden">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-6 max-w-6xl mx-auto">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Pip<span className="text-[#0066FF]">X</span>
        </h1>
        <div className="flex items-center gap-5">
          <Link href="/login" className="text-sm text-gray-400 hover:text-white transition">
            Log in
          </Link>
          <Link
            href="/signup"
            className="bg-[#0066FF] hover:bg-[#0052CC] text-sm font-semibold px-5 py-2.5 rounded-full transition"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 font-mono-num text-xs text-[#16E39B] border border-[#16E39B]/30 bg-[#16E39B]/5 rounded-full px-4 py-1.5 mb-8">
          A safe way to prove your trading skill
        </div>
        <h2 className="font-display text-5xl md:text-6xl font-bold leading-[1.08] mb-6">
          Real Markets.
          <br />
          Zero Risk.
          <br />
          <span className="text-[#0066FF]">Real Rewards.</span>
        </h2>
        <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
          Trade live market conditions on a real MT5 account with a virtual balance.
          Nothing to lose. Everything to gain if you're skilled.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="bg-[#0066FF] hover:bg-[#0052CC] font-semibold px-8 py-3.5 rounded-full transition"
          >
            Start Trading
          </Link>
          <Link
            href="#how-it-works"
            className="text-gray-300 hover:text-white font-medium px-4 py-3.5 transition"
          >
            How it works →
          </Link>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-[#1D2530] bg-[#0D1119]">
        <div className="max-w-4xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <p className="font-display font-bold text-lg mb-1">No real funds at risk</p>
            <p className="text-gray-500 text-sm">You trade with a virtual balance, never your own capital</p>
          </div>
          <div>
            <p className="font-display font-bold text-lg mb-1">Real market conditions</p>
            <p className="text-gray-500 text-sm">Live MT5 accounts, real price action, no simulations</p>
          </div>
          <div>
            <p className="font-display font-bold text-lg mb-1">Rewarded for skill</p>
            <p className="text-gray-500 text-sm">Consistent, disciplined trading is what gets recognized</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-24">
        <h3 className="font-display text-3xl font-bold text-center mb-4">
          Simple, transparent, fair
        </h3>
        <p className="text-gray-400 text-center mb-16 max-w-lg mx-auto">
          No hidden mechanics. No surprises. Just a clear path from sign-up to recognition.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: "Join a tournament",
              desc: "A small entry secures your spot for the week. Simple crypto payment, instant confirmation.",
            },
            {
              title: "Trade with confidence",
              desc: "You get a real MT5 account with a virtual balance. Trade forex and crypto pairs exactly as you would live.",
            },
            {
              title: "Get recognized",
              desc: "Your consistency and discipline show up on the leaderboard. The most skilled traders each week are rewarded.",
            },
          ].map((item) => (
            <div key={item.title} className="bg-[#10151D] border border-[#1D2530] rounded-2xl p-7">
              <h4 className="font-display font-bold text-lg mb-3">{item.title}</h4>
              <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Leaderboard podium — no numbers, just recognition */}
      <section className="max-w-5xl mx-auto px-6 py-20 border-t border-[#1D2530]">
        <div className="text-center mb-14">
          <p className="font-mono-num text-xs text-[#0066FF] mb-3 tracking-widest">
            THIS WEEK'S RECOGNIZED TRADERS
          </p>
          <h3 className="font-display text-3xl md:text-4xl font-bold">
            Discipline gets noticed
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-4 items-end max-w-xl mx-auto">
          {podium.map((p) => (
            <div
              key={p.rank}
              className={`bg-[#10151D] border-2 ${p.color} rounded-2xl p-5 text-center ${
                p.rank === 1 ? "pb-8 -mt-6" : "pb-5"
              }`}
            >
              <p className="font-mono-num text-xs text-gray-500 mb-2">{p.badge}</p>
              <p className="font-display font-bold text-lg mb-1">#{p.rank}</p>
              <p className="text-gray-300 text-sm truncate">{p.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-6 py-24 text-center border-t border-[#1D2530]">
        <h3 className="font-display text-3xl md:text-4xl font-bold mb-4">
          Your skill deserves a stage
        </h3>
        <p className="text-gray-400 mb-8 leading-relaxed">
          Join traders around the world who are proving themselves,
          one disciplined trade at a time.
        </p>
        <Link
          href="/signup"
          className="bg-[#0066FF] hover:bg-[#0052CC] font-semibold px-8 py-3.5 rounded-full transition inline-block"
        >
          Start Trading
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1D2530] px-6 py-8 text-center text-gray-500 text-sm">
        <p className="mb-2">© 2026 PipX. All rights reserved.</p>
        <div className="flex items-center justify-center gap-4 text-xs">
          <Link href="/terms" className="hover:text-gray-300 transition">
            Terms & Conditions
          </Link>
          <Link href="/privacy" className="hover:text-gray-300 transition">
            Privacy Policy
          </Link>
        </div>
      </footer>
    </main>
  );
}