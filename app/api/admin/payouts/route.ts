import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");

    if (!email || email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const tournamentsSnapshot = await adminDb.ref("tournaments").once("value");
    const tournaments = tournamentsSnapshot.val() || {};

    const payouts: any[] = [];

    for (const [tournamentId, data] of Object.entries(tournaments) as [string, any][]) {
      if (data.status !== "completed" || !data.winners) continue;

      for (const [rank, winner] of Object.entries(data.winners) as [string, any][]) {
        payouts.push({
          tournamentId,
          tournamentName: data.name,
          rank: Number(rank),
          uid: winner.uid,
          email: winner.email,
          walletAddress: winner.walletAddress,
          prize: winner.prize,
          paid: winner.paid || false,
        });
      }
    }

    payouts.sort((a, b) => (a.paid === b.paid ? 0 : a.paid ? 1 : -1));

    return NextResponse.json({ payouts });
  } catch (error) {
    console.error("Payouts fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch payouts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, tournamentId, rank } = await req.json();

    if (!email || email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await adminDb.ref(`tournaments/${tournamentId}/winners/${rank}/paid`).set(true);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark paid error:", error);
    return NextResponse.json({ error: "Failed to update payout status" }, { status: 500 });
  }
}