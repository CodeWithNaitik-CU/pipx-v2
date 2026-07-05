import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { uid, email } = await req.json();

    if (!uid || !email) {
      return NextResponse.json({ error: "Missing user info" }, { status: 400 });
    }

    const response = await fetch("https://api.nowpayments.io/v1/invoice", {
      method: "POST",
      headers: {
        "x-api-key": process.env.NOWPAYMENTS_API_KEY as string,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        price_amount: 5,
        price_currency: "usd",
        pay_currency: "usdttrc20",
        order_id: `pipx-entry-${uid}-${Date.now()}`,
        order_description: "PipX Tournament Entry Fee",
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=cancelled`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.message || "Payment creation failed" }, { status: 500 });
    }

    return NextResponse.json({ invoiceUrl: data.invoice_url });
  } catch (error) {
    console.error("Payment creation error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}