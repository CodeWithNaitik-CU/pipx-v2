import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb } from "@/lib/firebaseAdmin";
import { getCurrentTournamentId, getCurrentWeekRange } from "@/lib/tournament";

function sortObject(obj: any): any {
  if (typeof obj !== "object" || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(sortObject);
  return Object.keys(obj)
    .sort()
    .reduce((result: any, key) => {
      result[key] = sortObject(obj[key]);
      return result;
    }, {});
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-nowpayments-sig");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const body = JSON.parse(rawBody);
    const sortedBody = JSON.stringify(sortObject(body));

    const expectedSignature = crypto
      .createHmac("sha512", process.env.NOWPAYMENTS_IPN_SECRET as string)
      .update(sortedBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("Invalid IPN signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const { order_id, payment_status, payment_id } = body;

    if (payment_status === "finished" || payment_status === "confirmed") {
      // Idempotency check — has this exact payment already been processed?
      const processedRef = adminDb.ref(`processedPayments/${payment_id}`);
      const processedSnapshot = await processedRef.once("value");

      if (processedSnapshot.exists()) {
        console.log(`Payment ${payment_id} already processed, skipping`);
        return NextResponse.json({ received: true, alreadyProcessed: true });
      }

      const parts = order_id.split("-");
      const uid = parts[2];

      if (uid) {
        const tournamentId = getCurrentTournamentId();
        const { startDate, endDate } = getCurrentWeekRange();
        const tournamentRef = adminDb.ref(`tournaments/${tournamentId}`);

        const snapshot = await tournamentRef.once("value");

        if (!snapshot.exists()) {
          await tournamentRef.set({
            name: `Weekly Championship - ${tournamentId}`,
            startDate,
            endDate,
            entryFee: 5,
            prizePool: 0,
            status: "active",
            participants: {},
          });
          console.log(`Created new tournament: ${tournamentId}`);
        }

        // Check if this user is ALREADY a participant — prevent re-entry from resetting their progress
        const participantSnapshot = await adminDb
          .ref(`tournaments/${tournamentId}/participants/${uid}`)
          .once("value");

        if (participantSnapshot.exists()) {
          console.log(`User ${uid} already joined tournament ${tournamentId}, marking payment processed but not resetting`);
          await processedRef.set({ processedAt: Date.now(), uid, note: "duplicate-entry-ignored" });
          return NextResponse.json({ received: true, duplicateEntry: true });
        }

        // First-time entry for this user in this tournament
        await adminDb.ref(`tournaments/${tournamentId}/participants/${uid}`).set({
          joinedAt: Date.now(),
          startingBalance: 1000,
          currentEquity: 1000,
          rank: null,
        });

        const currentSnapshot = await adminDb.ref(`tournaments/${tournamentId}/prizePool`).once("value");
        const currentPool = currentSnapshot.val() || 0;
        await tournamentRef.update({
          prizePool: currentPool + 5,
        });

        await adminDb.ref(`users/${uid}`).update({
          currentTournamentId: tournamentId,
        });

        // Mark this payment as processed
        await processedRef.set({ processedAt: Date.now(), uid, tournamentId });

        console.log(`User ${uid} joined tournament ${tournamentId}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}