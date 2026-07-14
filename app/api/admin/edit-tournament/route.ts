import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { email, tournamentId, name, startDate, endDate } = await req.json();

    if (!email || email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!tournamentId) {
      return NextResponse.json({ error: "Missing tournamentId" }, { status: 400 });
    }

    const tournamentRef = adminDb.ref(`tournaments/${tournamentId}`);
    const snapshot = await tournamentRef.once("value");

    if (!snapshot.exists()) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    const updates: Record<string, any> = {};
    if (name) updates.name = name;
    if (startDate) updates.startDate = new Date(startDate).getTime();
    if (endDate) updates.endDate = new Date(endDate).getTime();

    await tournamentRef.update(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Edit tournament error:", error);
    return NextResponse.json({ error: "Failed to update tournament" }, { status: 500 });
  }
}