"use server";

import { stripe } from "@/lib/stripe"; 
import { getConvexClient } from "@/lib/convex"; 
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel"; 
import baseUrl from "@/lib/baseUrl"; 
import { auth } from "@clerk/nextjs/server"; 
import { DURATIONS } from "@/convex/constant"; 

export type StripeCheckoutMetaData = {
  eventId: Id<"events">;
  userId: string;
  waitingListId: Id<"waitingList">;
};

export async function createStripeCheckoutSession({
  eventId,
}: {
  eventId: Id<"events">;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized: User is not authenticated.");

  const convex = getConvexClient();

  const event = await convex.query(api.events.getEventById, { eventId });
  if (!event) throw new Error(`Event with ID ${eventId} not found.`);

  const queuePosition = await convex.query(api.waiting.getQueuePosition, {
    eventId,
    userId,
  });

  if (!queuePosition || queuePosition.status !== "offered") {
    throw new Error("No active ticket offer available for this user.");
  }

  if (!queuePosition.offerExpiresAt) {
    throw new Error("Invalid ticket offer: Missing expiration timestamp.");
  }

  const metadata: StripeCheckoutMetaData = {
    eventId,
    userId,
    waitingListId: queuePosition._id,
  };

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"], 
      line_items: [
        {
          price_data: {
            currency: "gbp", 
            product_data: {
              name: event.name, 
              description: event.description, 
            },
            unit_amount: Math.round(event.price * 100),          },
          quantity: 1,
        },
      ],
      expires_at: Math.floor(Date.now() / 1000) + DURATIONS.TICKET_OFFER / 1000, 
      mode: "payment", 
      success_url: `${baseUrl}/tickets/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/event/${eventId}`, 
      metadata, 
    });

    return { sessionId: session.id, sessionUrl: session.url };
  } catch (error) {
    console.error("Stripe Checkout Session Error:", error);
    throw new Error("Failed to create Stripe Checkout session. Please try again.");
  }
}
