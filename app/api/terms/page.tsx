import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0A0E14] text-[#F5F7FA] font-sans">
      <nav className="flex items-center justify-between px-6 py-5 max-w-3xl mx-auto">
        <Link href="/" className="font-display text-2xl font-bold tracking-tight">
          Pip<span className="text-[#0066FF]">X</span>
        </Link>
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition">
          ← Back to Dashboard
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl font-bold mb-2">Terms & Conditions</h1>
        <p className="text-gray-500 text-sm mb-10">Last updated: July 2026</p>

        <div className="space-y-8 text-gray-300 text-sm leading-relaxed">
          <section>
            <h2 className="font-display text-lg font-bold text-white mb-2">1. About PipX</h2>
            <p>
              PipX is a skill-based trading competition platform operated by Naitik and team
              ("PipX," "we," "us"). By creating an account or entering a tournament, you agree to
              these Terms & Conditions.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-white mb-2">2. How PipX Works</h2>
            <p>
              PipX runs weekly trading tournaments. Entry requires a fixed fee paid in
              cryptocurrency. Upon entry, participants receive a virtual starting balance to trade
              against live, real-time market prices (including gold and cryptocurrency pairs)
              within PipX's own trading interface. No real funds are traded, borrowed, or placed at
              risk beyond the entry fee itself. Profit and loss are calculated based on simulated
              positions only.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-white mb-2">3. Entry Fees & Refunds</h2>
            <p>
              Entry fees are paid in cryptocurrency prior to tournament participation. Once a
              tournament has started and a participant's virtual balance has been allocated,
              entry fees are non-refundable, including in cases where a participant chooses not to
              trade, trades unsuccessfully, or is otherwise dissatisfied with tournament outcomes.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-white mb-2">4. Prizes & Payouts</h2>
            <p>
              Prize pools are formed from collected entry fees for each tournament and distributed
              to top-ranked participants at the conclusion of each tournament, based on final
              leaderboard standing. Payouts are made in cryptocurrency to a wallet address provided
              by the winning participant. PipX is not responsible for delays, losses, or errors
              resulting from incorrect wallet addresses provided by participants.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-white mb-2">5. Fair Play</h2>
            <p>
              Participants agree not to exploit bugs, manipulate price data, operate multiple
              accounts to gain unfair advantage, or otherwise act in bad faith. PipX reserves the
              right to disqualify any participant and withhold prizes if fair play violations are
              identified, at our reasonable discretion.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-white mb-2">6. Market Data</h2>
            <p>
              Live prices used for trading simulations are sourced from third-party market data
              providers. While we aim for accuracy, PipX does not guarantee that displayed prices
              perfectly match real-world exchange or broker pricing at every instant, and minor
              discrepancies may occur. All trade executions use the price available to PipX's
              systems at the time of the action, which is treated as final for that trade.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-white mb-2">7. Eligibility</h2>
            <p>
              Participants must be at least 18 years old and legally permitted to participate in
              skill-based paid competitions under the laws of their jurisdiction. It is the
              participant's responsibility to confirm their local eligibility before entering any
              tournament.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-white mb-2">8. Limitation of Liability</h2>
            <p>
              PipX provides this platform on an "as is" basis. We are not liable for any indirect,
              incidental, or consequential damages arising from use of the platform, including
              technical failures, downtime, or data inaccuracies, to the maximum extent permitted
              by law.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-white mb-2">9. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. Continued use of PipX after changes are
              posted constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-white mb-2">10. Governing Law</h2>
            <p>
              These Terms are governed by the laws of India. Any disputes shall be subject to the
              jurisdiction of Indian courts.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-white mb-2">11. Contact</h2>
            <p>
              For questions regarding these Terms, please reach out through the contact details
              provided on the PipX platform.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}