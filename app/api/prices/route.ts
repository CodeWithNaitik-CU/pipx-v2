import { NextResponse } from "next/server";
import { getAllPrices } from "@/lib/prices";

export async function GET() {
  try {
    const prices = await getAllPrices();
    return NextResponse.json(prices);
  } catch (error) {
    console.error("Price fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch prices" }, { status: 500 });
  }
}