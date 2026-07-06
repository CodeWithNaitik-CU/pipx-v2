import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getCurrentTournamentId, getCurrentWeekRange } from "@/lib/tournament";
import { createMT5AccountForUser } from "@/lib/metaapi";

// Only these emails can use this free bypass — add your own test emails here
const ALLOWED_TEST_EMAILS = ["test@gmail.com", "test2@pipx.com", "test3@pipx.com"];

export async function POST(req: NextRequest) {
  try {
    const { uid, email } = await req.json();

    if (!uid || !email) {
      return NextResponse.json({ error: "Missing user info" }, { status: 400 });
    }

    if (!ALLOWED_TEST_EMAILS.includes(email)) {
      return NextResponse.json({ error: "Not authorized for free entry" }, { status: 403 });
    }

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
    }

    await adminDb.ref(`tournaments/${tournamentId}/participants/${uid}`).update({
      joinedAt: Date.now(),
      mt5Login: null,
      startingBalance: 1000,
      currentEquity: 1000,
      rank: null,
    });

    let mt5Account;
    try {
      mt5Account = await createMT5AccountForUser(uid, `${uid}@pipx.trader`);
    } catch (mt5Error) {
      console.error(`MT5 provisioning failed for ${uid}:`, mt5Error);
    }

    const userUpdate: any = { currentTournamentId: tournamentId };

    if (mt5Account) {
      userUpdate.mt5Account = {
        login: mt5Account.login,
        investorPassword: mt5Account.investorPassword,
        server: mt5Account.server,
      };

      await adminDb.ref(`tournaments/${tournamentId}/participants/${uid}`).update({
        mt5Login: mt5Account.login,
      });
    }

    await adminDb.ref(`users/${uid}`).update(userUpdate);

    return NextResponse.json({ success: true, tournamentId, mt5Account });
  } catch (error) {
    console.error("Dev join error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}