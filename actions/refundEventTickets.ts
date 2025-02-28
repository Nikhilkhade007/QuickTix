'use server'
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel'
import { getConvexClient } from '@/lib/convex'
import { stripe } from '@/lib/stripe';

export async function refundEventTickets(eventId:Id<"events">) {
  const convex = getConvexClient();
  const event = await convex.query(api.events.getEventById,{eventId});
  
  if (!event) {
    throw new Error("Event not found");
  }
  const tickets = await convex.query(api.ticket.getAllValidTickets,{eventId})

  const results = await Promise.allSettled(tickets.map(
    async (ticket)=>{
      try {
        if (!ticket.paymentIntentId){
          throw new Error("Payment id is not found")
        }

        await stripe.refunds.create(
          {
            payment_intent:ticket.paymentIntentId,
            reason:"requested_by_customer"
          }
        )

        await convex.mutation(api.ticket.updateTicket,{ticketId:ticket._id,status:"refunded"})
        return { success: true, ticketId: ticket._id };
      } catch (error) {
        console.error(`Failed to refund ticket ${ticket._id}:`, error);
        return { success: false, ticketId: ticket._id, error };
      }
    }
  ))

  const allSuccessful = results.every(
    (result) => result.status === "fulfilled" && result.value.success
  );

  if (!allSuccessful) {
    throw new Error(
      "Some refunds failed. Please check the logs and try again."
    );
  }

  await convex.mutation(api.events.cancelEvent, { eventId });

  return { success: true };
  
}

export default refundEventTickets