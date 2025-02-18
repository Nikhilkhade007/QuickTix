// "use server";

// import { stripe } from "@/lib/stripe";
// import { getConvexClient } from "@/lib/convex";
// import { api } from "@/convex/_generated/api";
// import { Id } from "@/convex/_generated/dataModel";
// import baseUrl from "@/lib/baseUrl";
// import { auth } from "@clerk/nextjs/server";
// import { DURATIONS } from "@/convex/constant";

// export type StripeCheckoutMetaData = {
//   eventId: Id<"events">;
//   userId: string;
//   waitingListId: Id<"waitingList">;
// };

// export async function createStripeCheckoutSession({
//   eventId,
// }: {
//   eventId: Id<"events">;
// }) {
//   const { userId } = await auth();
//   if (!userId) throw new Error("Unauthorized: User is not authenticated.");

//   const convex = getConvexClient();

//   // Fetch event details
//   const event = await convex.query(api.events.getEventById, { eventId });
//   if (!event) throw new Error(`Event with ID ${eventId} not found.`);

//   // Fetch waiting list position
//   const queuePosition = await convex.query(api.waiting.getQueuePosition, {
//     eventId,
//     userId,
//   });

//   if (!queuePosition || queuePosition.status !== "offered") {
//     throw new Error("No active ticket offer available for this user.");
//   }

//   if (!queuePosition.offerExpiresAt) {
//     throw new Error("Invalid ticket offer: Missing expiration timestamp.");
//   }

//   // Define metadata for tracking
//   const metadata: StripeCheckoutMetaData = {
//     eventId,
//     userId,
//     waitingListId: queuePosition._id,
//   };

//   try {
//     // Create Stripe Checkout Session
//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ["card"],
//       line_items: [
//         {
//           price_data: {
//             currency: "gbp",
//             product_data: {
//               name: event.name,
//               description: event.description,
//             },
//             unit_amount: Math.round(event.price * 100),
//           },
//           quantity: 1,
//         },
//       ],
//       expires_at: Math.floor(Date.now() / 1000) + DURATIONS.TICKET_OFFER / 1000, // Minimum 30 min
//       mode: "payment",
//       success_url: `${baseUrl}/tickets/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
//       cancel_url: `${baseUrl}/event/${eventId}`,
//       metadata,
//     });

//     return { sessionId: session.id, sessionUrl: session.url };
//   } catch (error) {
//     console.error("Stripe Checkout Session Error:", error);
//     throw new Error("Failed to create Stripe Checkout session. Please try again.");
//   }
// }


"use server";

import { stripe } from "@/lib/stripe"; // Ensure your Stripe instance is correctly set up
import { getConvexClient } from "@/lib/convex"; // Your Convex client setup
import { api } from "@/convex/_generated/api"; // Ensure your Convex API queries are set up
import { Id } from "@/convex/_generated/dataModel"; // Your Convex ID type
import baseUrl from "@/lib/baseUrl"; // Ensure baseUrl is set up correctly in your environment variables
import { auth } from "@clerk/nextjs/server"; // Clerk authentication for user authentication
import { DURATIONS } from "@/convex/constant"; // Your constant for durations, e.g., ticket offer time

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
  // Get the authenticated user's ID
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized: User is not authenticated.");

  const convex = getConvexClient();

  // Fetch event details
  const event = await convex.query(api.events.getEventById, { eventId });
  if (!event) throw new Error(`Event with ID ${eventId} not found.`);

  // Fetch waiting list position for the user
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

  // Define metadata for tracking during the webhook
  const metadata: StripeCheckoutMetaData = {
    eventId,
    userId,
    waitingListId: queuePosition._id,
  };

  try {
    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"], // Only allow card payments
      line_items: [
        {
          price_data: {
            currency: "gbp", // Currency in GBP
            product_data: {
              name: event.name, // Event name
              description: event.description, // Event description
            },
            unit_amount: Math.round(event.price * 100), // Convert price to smallest unit (pence)
          },
          quantity: 1,
        },
      ],
      expires_at: Math.floor(Date.now() / 1000) + DURATIONS.TICKET_OFFER / 1000, // Set expiration for the checkout session
      mode: "payment", // Mode set to payment (not subscription)
      success_url: `${baseUrl}/tickets/purchase-success?session_id={CHECKOUT_SESSION_ID}`, // Redirect on successful payment
      cancel_url: `${baseUrl}/event/${eventId}`, // Redirect if user cancels payment
      metadata, // Include metadata in the checkout session for tracking
    });

    // Return session details
    return { sessionId: session.id, sessionUrl: session.url };
  } catch (error) {
    // Log the error for debugging purposes
    console.error("Stripe Checkout Session Error:", error);
    throw new Error("Failed to create Stripe Checkout session. Please try again.");
  }
}
