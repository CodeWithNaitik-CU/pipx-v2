import Link from "next/link";

export default function PrivacyPage() {
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
        <h1 className="font-display text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-10">Last updated: July 2026</p>

        <div className="space-y-8 text-gray-300 text-sm leading-relaxed">
          <section>
            <h2 className="font-display text-lg font-bold text-white mb-2">1. Information We Collect</h2>
            <p>
              When you use PipX, we collect: your email address (for account creation and login),
              trading activity within tournaments (positions, P&L, tournament participation), and
              payment-related metadata processed through our third-party crypto payment provider,
              NOWPayments. We do not collect or store your private wallet keys or seed phrases.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-white mb-2">2. How We Use Your Information</h2>
            <p>
              We use collected information to operate tournaments, calculate leaderboard rankings,
              process entry payments, distribute prizes, and communicate important updates about
              your account or tournament participation.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-white mb-2">3. Third-Party Services</h2>
            <p>
              PipX uses the following third-party services to operate: Firebase (Google) for
              authentication and data storage, NOWPayments for cryptocurrency payment processing,
              Vercel for application hosting, and third-party market data providers for live price
              feeds. These providers may process limited data as necessary to perform their
              services, subject to their own privacy policies.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-white mb-2">4. Data Storage & Security</h2>
            <p>
              Your account data is stored in Firebase Realtime Database with access rules that
              restrict each user to their own data. We take reasonable measures to protect your
              information but cannot guarantee absolute security, as no system is completely
              immune to unauthorized access.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-white mb-2">5. Data Retention</h2>
            <p>
              We retain account and trading history data for as long as your account remains
              active, or as needed to resolve disputes, enforce our Terms, or comply with legal
              obligations.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-white mb-2">6. Your Rights</h2>
            <p>
              You may request access to, correction of, or deletion of your personal data by
              contacting us through the platform. Note that certain trading and payment records
              may be retained where required for legal or dispute-resolution purposes.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-white mb-2">7. Cookies</h2>
            <p>
              PipX uses essential cookies/local storage required for authentication sessions. We
              do not currently use third-party advertising or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-white mb-2">8. Children's Privacy</h2>
            <p>
              PipX is not intended for use by individuals under 18 years of age. We do not
              knowingly collect data from minors.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-white mb-2">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. Continued use of PipX after changes
              are posted constitutes acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold text-white mb-2">10. Contact</h2>
            <p>
              For privacy-related questions or requests, please reach out through the contact
              details provided on the PipX platform.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}