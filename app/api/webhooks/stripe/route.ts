import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import Stripe from "stripe";
import { StripeCheckoutMetaData } from "@/actions/createStripeCheckoutSession";

export async function POST(req: Request) {
  console.log("🔔 Stripe Webhook received");

  const body = await req.text();
  const headersList = headers();
  const signature = (await headersList).get("stripe-signature");

  if (!signature) {
    console.error("❌ Missing Stripe signature");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    console.log("🛠️ Verifying webhook event...");
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    console.log(`✅ Webhook verified: ${event.type}`);
  } catch (err) {
    console.error("❌ Webhook verification failed:", err);
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const convex = getConvexClient();

  if (event.type === "checkout.session.completed") {
    console.log("🎟️ Processing ticket purchase...");
    
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata as StripeCheckoutMetaData;

    if (!metadata?.eventId || !metadata?.userId || !metadata?.waitingListId) {
      console.error("❌ Missing metadata in Stripe session");
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    try {
      const result = await convex.mutation(api.events.purchaseTicket, {
        eventId: metadata.eventId,
        userId: metadata.userId,
        waitingListId: metadata.waitingListId,
        paymentInfo: {
          paymentIntentId: session.payment_intent as string,
          amount: session.amount_total ?? 0,
        },
      });

      console.log("✅ Ticket purchase recorded:", result);
    } catch (error) {
      console.error("❌ Error updating ticket purchase in Convex:", error);
      return NextResponse.json({ error: "Database update failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
