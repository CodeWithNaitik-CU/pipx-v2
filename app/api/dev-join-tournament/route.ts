import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getCurrentTournamentId, getCurrentWeekRange } from "@/lib/tournament";

// Only these emails can use this free bypass — add your own test emails here
const ALLOWED_TEST_EMAILS = ["test@gmail.com", "test2@pipx.com", "realtest@gmail.com"];

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
      startingBalance: 1000,
      currentEquity: 1000,
      rank: null,
    });

    await adminDb.ref(`users/${uid}`).update({
      currentTournamentId: tournamentId,
    });

    return NextResponse.json({ success: true, tournamentId });
  } catch (error) {
    console.error("Dev join error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}