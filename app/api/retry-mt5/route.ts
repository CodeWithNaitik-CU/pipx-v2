import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { createMT5AccountForUser } from "@/lib/metaapi";

export async function POST(req: NextRequest) {
  try {
    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    const userSnapshot = await adminDb.ref(`users/${uid}`).once("value");
    const userData = userSnapshot.val();

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (userData.mt5Status === "ready") {
      return NextResponse.json({ error: "MT5 account already set up" }, { status: 400 });
    }

    if (!userData.currentTournamentId) {
      return NextResponse.json({ error: "User is not in an active tournament" }, { status: 400 });
    }

    try {
      const mt5Account = await createMT5AccountForUser(uid, `${uid}@pipx.trader`);

      await adminDb.ref(`users/${uid}`).update({
        mt5Status: "ready",
        mt5Account: {
          login: mt5Account.login,
          investorPassword: mt5Account.investorPassword,
          server: mt5Account.server,
        },
      });

      await adminDb
        .ref(`tournaments/${userData.currentTournamentId}/participants/${uid}`)
        .update({ mt5Login: mt5Account.login });

      return NextResponse.json({ success: true, mt5Account });
    } catch (mt5Error) {
      console.error(`Retry MT5 provisioning failed for ${uid}:`, mt5Error);
      await adminDb.ref(`users/${uid}`).update({ mt5Status: "failed" });
      return NextResponse.json({ error: "MT5 setup failed again. Please try again shortly." }, { status: 500 });
    }
  } catch (error) {
    console.error("Retry MT5 error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}