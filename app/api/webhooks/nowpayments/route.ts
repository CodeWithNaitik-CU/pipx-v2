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

    const { order_id, payment_status } = body;

    if (payment_status === "finished" || payment_status === "confirmed") {
      const parts = order_id.split("-");
      const uid = parts[2];

      if (uid) {
        const tournamentId = getCurrentTournamentId();
        const { startDate, endDate } = getCurrentWeekRange();
        const tournamentRef = ref(db, `tournaments/${tournamentId}`);

        // Check if this week's tournament already exists
        const snapshot = await get(tournamentRef);

        if (!snapshot.exists()) {
          // First person this week — create the tournament
          await set(tournamentRef, {
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

        // Add this user as a participant
        await update(ref(db, `tournaments/${tournamentId}/participants/${uid}`), {
          joinedAt: Date.now(),
          mt5Login: null,
          startingBalance: 1000,
          currentEquity: 1000,
          rank: null,
        });

        // Increment the prize pool
        const currentSnapshot = await get(ref(db, `tournaments/${tournamentId}/prizePool`));
        const currentPool = currentSnapshot.val() || 0;
        await update(tournamentRef, {
          prizePool: currentPool + 5,
        });

        // Update the user's profile
        await update(ref(db, `users/${uid}`), {
          currentTournamentId: tournamentId,
        });

        console.log(`User ${uid} joined tournament ${tournamentId}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}