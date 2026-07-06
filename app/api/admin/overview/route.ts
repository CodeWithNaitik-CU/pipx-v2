import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getAuth } from "firebase-admin/auth";

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");

    if (!email || email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch all tournaments
    const tournamentsSnapshot = await adminDb.ref("tournaments").once("value");
    const tournaments = tournamentsSnapshot.val() || {};

    // Fetch all users
    const usersSnapshot = await adminDb.ref("users").once("value");
    const users = usersSnapshot.val() || {};

    // Build a summary
    const tournamentList = Object.entries(tournaments).map(([id, data]: [string, any]) => ({
      id,
      name: data.name,
      status: data.status,
      prizePool: data.prizePool,
      participantCount: data.participants ? Object.keys(data.participants).length : 0,
      startDate: data.startDate,
      endDate: data.endDate,
    }));

    const userList = Object.entries(users).map(([uid, data]: [string, any]) => ({
      uid,
      email: data.email,
      username: data.username,
      currentTournamentId: data.currentTournamentId,
      hasMT5: !!data.mt5Account?.login,
      createdAt: data.createdAt,
    }));

    return NextResponse.json({ tournaments: tournamentList, users: userList });
  } catch (error) {
    console.error("Admin overview error:", error);
    return NextResponse.json({ error: "Failed to fetch admin data" }, { status: 500 });
  }
}