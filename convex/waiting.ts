import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { DURATIONS, WAITING_LIST_STATUS, TICKET_STATUS} from "./constant";
import { internal } from "./_generated/api";
import { getAvailableEvent } from "./events";

function groupByEvent(
  offers: Array<{ eventId: Id<"events">; _id: Id<"waitingList"> }>
) {
  return offers.reduce(
    (acc, offer) => {
      const eventId = offer.eventId;
      if (!acc[eventId]) {
        acc[eventId] = [];
      }
      acc[eventId].push(offer);
      return acc;
    },
    {} as Record<Id<"events">, typeof offers>
  );
}

export const getQueuePosition = query({
  args: {
    eventId: v.id("events"),
    userId: v.string(),
  },
  handler: async (ctx, { eventId, userId }) => {
    const entry = await ctx.db
      .query("waitingList")
      .withIndex("by_user_event", (q) =>
        q.eq("userId", userId).eq("eventId", eventId)
      )
      .filter((q) => q.neq(q.field("status"), WAITING_LIST_STATUS.EXPIRED))
      .first();

    if (!entry) return null;

    const peopleAhead = await ctx.db
      .query("waitingList")
      .withIndex("by_event_status", (q) => q.eq("eventId", eventId))
      .filter((q) =>
        q.and(
          q.lt(q.field("_creationTime"), entry._creationTime),
          q.or(
            q.eq(q.field("status"), WAITING_LIST_STATUS.WAITING),
            q.eq(q.field("status"), WAITING_LIST_STATUS.OFFERED)
          )
        )
      )
      .collect()
      .then((entries) => entries.length);

    return {
      ...entry,
      position: peopleAhead + 1,
    };
  },
});

export const processQueue = mutation({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, { eventId }) => {
    const event = await ctx.db.get(eventId);
    if (!event) throw new Error("Event not found");

   const {remainingTickets:availableSpots} = await getAvailableEvent(ctx,{eventId})

    if (availableSpots <= 0) return;

    const waitingUsers = await ctx.db
      .query("waitingList")
      .withIndex("by_event_status", (q) =>
        q.eq("eventId", eventId).eq("status", WAITING_LIST_STATUS.WAITING)
      )
      .order("asc")
      .take(availableSpots);

    const now = Date.now();
    for (const user of waitingUsers) {
      await ctx.db.patch(user._id, {
        status: WAITING_LIST_STATUS.OFFERED,
        offerExpiresAt: now + DURATIONS.TICKET_OFFER,
      });

      await ctx.scheduler.runAfter(
        DURATIONS.TICKET_OFFER,
        internal.waiting.expireOffer,
        {
          waitingListId: user._id,
          eventId,
        }
      );
    }
  },
});


export const expireOffer = internalMutation({
  args:{
    waitingListId:v.id("waitingList"),
    eventId:v.id("events")
  },handler: async(ctx,{eventId,waitingListId})=>{
      const offer = await ctx.db.get(waitingListId);
      if (!offer || offer.status !== WAITING_LIST_STATUS.OFFERED) return;

      await ctx.db.patch(waitingListId,{
        status: WAITING_LIST_STATUS.EXPIRED
      })
  }
})


export const cleanupExpiredOffers = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expiredOffers = await ctx.db
      .query("waitingList")
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), WAITING_LIST_STATUS.OFFERED),
          q.lt(q.field("offerExpiresAt"), now)
        )
      )
      .collect();

    const grouped = groupByEvent(expiredOffers);

    for (const [eventId, offers] of Object.entries(grouped)) {
      await Promise.all(
        offers.map((offer) =>
          ctx.db.patch(offer._id, {
            status: WAITING_LIST_STATUS.EXPIRED,
          })
        )
      );

      await processQueue(ctx, { eventId: eventId as Id<"events"> });
    }
  },
});

export const releaseTicket = mutation({
  args:{
    eventId:v.id("events"),
    waitingListId :v.id("waitingList")
  },handler : async(ctx,{eventId,waitingListId})=>{
      const entry = await ctx.db.get(waitingListId);
      if (!entry || entry.status !== WAITING_LIST_STATUS.OFFERED) throw new Error("No valid offer found");

      await ctx.db.patch(waitingListId,{
        status: WAITING_LIST_STATUS.EXPIRED
      })

      await processQueue(ctx,{eventId})

  }
})