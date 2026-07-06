import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb } from "@/lib/firebaseAdmin";
import { getCurrentTournamentId, getCurrentWeekRange } from "@/lib/tournament";
import { createMT5AccountForUser } from "@/lib/metaapi";

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
        const tournamentRef = adminDb.ref(`tournaments/${tournamentId}`);

        // Check if this week's tournament already exists
        const snapshot = await tournamentRef.once("value");

        if (!snapshot.exists()) {
          // First person this week — create the tournament
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

        // Add this user as a participant
        await adminDb.ref(`tournaments/${tournamentId}/participants/${uid}`).update({
          joinedAt: Date.now(),
          mt5Login: null,
          startingBalance: 1000,
          currentEquity: 1000,
          rank: null,
        });

        // Increment the prize pool
        const currentSnapshot = await adminDb.ref(`tournaments/${tournamentId}/prizePool`).once("value");
        const currentPool = currentSnapshot.val() || 0;
        await tournamentRef.update({
          prizePool: currentPool + 5,
        });

        // Create a real MT5 demo account for this user
        // Create a real MT5 demo account for this user
        let mt5Account;
        let mt5Status = "pending";
        try {
          mt5Account = await createMT5AccountForUser(uid, `${uid}@pipx.trader`);
          mt5Status = "ready";
          console.log(`MT5 account created for ${uid}:`, mt5Account.login);
        } catch (mt5Error) {
          mt5Status = "failed";
          console.error(`MT5 provisioning failed for ${uid}:`, mt5Error);
        }

        // Update the user's profile
        // Update the user's profile
        const userUpdate: any = {
          currentTournamentId: tournamentId,
          mt5Status,
        };

        if (mt5Account) {
          userUpdate.mt5Account = {
            login: mt5Account.login,
            investorPassword: mt5Account.investorPassword,
            server: mt5Account.server,
          };

          // Also store MT5 login on the tournament participant entry
          await adminDb.ref(`tournaments/${tournamentId}/participants/${uid}`).update({
            mt5Login: mt5Account.login,
          });
        }

        await adminDb.ref(`users/${uid}`).update(userUpdate);

        console.log(`User ${uid} joined tournament ${tournamentId}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}