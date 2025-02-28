import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { DURATIONS, TICKET_STATUS, WAITING_LIST_STATUS } from "./constant";
import { internal } from "./_generated/api";
import { processQueue } from "./waiting";

export const get = query({
    args:{},
    handler:async (ctx)=>{
        return await ctx.db.query("events").filter(q=> q.eq(q.field("is_cancelled"),undefined)).collect();
    }
});

export type Metrics = {
    soldTickets: number;
    refundedTickets: number;
    cancelledTickets: number;
    revenue: number;
  };
export const getEventById = query({
    args:{
        eventId:v.id("events")
    },handler :async (ctx,{eventId})=>{
        return await ctx.db.get(eventId);
    }
})
export const create  = mutation({
    args:{
    name: v.string(),
    description: v.string(),
    location: v.string(),
    eventDate: v.number(), 
    price: v.number(),
    totalTickets: v.number(),
    userId: v.string(),
    },handler : async(ctx,{name,description,location,eventDate,price,totalTickets,userId})=> {
        const eventId = await ctx.db.insert("events",{
            name,
            description,
            location,
            eventDate,
            price,
            totalTickets,
            userId
        })
        return eventId;
    },
})
export const updateEvent = mutation({
    args:{
        eventId:v.id("events"),
        name:v.string(),
        description:v.string(),
        price:v.number(),
        totalTickets:v.number(),
        eventDate:v.number(),
        location:v.string()

    },handler: async(ctx, args)=> {
        const {eventId,...updates}  = args;
        const event = await ctx.db.get(args.eventId)
        if (!event){
            throw new Error("This event is not present in database")
        }

        const totalsold = await ctx.db.query("tickets").withIndex("by_event",q=>q.eq("eventId",args.eventId))
        .filter(
            q=>(
                q.or(
                    q.eq(q.field("status"),"valid"),
                    q.eq(q.field("status"),"used")
                )
            )
        ).collect().then(e=>e.length)

        if (totalsold > args.totalTickets){
            throw new Error("Total tickets cannot be less than sold tickets")
        }

        await ctx.db.patch(args.eventId,updates);
    },
})
// const rateLimiter = new RateLimiter(components.rateLimiter, {
//     queueJoin: {
//       kind: "fixed window",
//       rate: 3, // 3 joins allowed
//       period: 30 * MINUTE, // in 30 minutes
//     },
//   });
export const purchaseTicket = mutation({
    args: {
      eventId: v.id("events"),
      userId: v.string(),
      waitingListId: v.id("waitingList"),
      paymentInfo: v.object({
        paymentIntentId: v.string(),
        amount: v.number(),
      }),
    },
    handler: async (ctx, { eventId, userId, waitingListId, paymentInfo }) => {
      console.log("Starting purchaseTicket handler", {
        eventId,
        userId,
        waitingListId,
      });
  
      // Verify waiting list entry exists and is valid
      const waitingListEntry = await ctx.db.get(waitingListId);
      console.log("Waiting list entry:", waitingListEntry);
  
      if (!waitingListEntry) {
        console.error("Waiting list entry not found");
        throw new Error("Waiting list entry not found");
      }
  
      if (waitingListEntry.status !== WAITING_LIST_STATUS.OFFERED) {
        console.error("Invalid waiting list status", {
          status: waitingListEntry.status,
        });
        throw new Error(
          "Invalid waiting list status - ticket offer may have expired"
        );
      }
  
      if (waitingListEntry.userId !== userId) {
        console.error("User ID mismatch", {
          waitingListUserId: waitingListEntry.userId,
          requestUserId: userId,
        });
        throw new Error("Waiting list entry does not belong to this user");
      }
  
      // Verify event exists and is active
      const event = await ctx.db.get(eventId);
      console.log("Event details:", event);
  
      if (!event) {
        console.error("Event not found", { eventId });
        throw new Error("Event not found");
      }
  
      if (event.is_cancelled) {
        console.error("Attempted purchase of cancelled event", { eventId });
        throw new Error("Event is no longer active");
      }
  
      try {
        console.log("Creating ticket with payment info", paymentInfo);
        // Create ticket with payment info
        await ctx.db.insert("tickets", {
          eventId,
          userId,
          purchasedAt: Date.now(),
          status: TICKET_STATUS.VALID,
          paymentIntentId: paymentInfo.paymentIntentId,
          amount: paymentInfo.amount,
        });
  
        console.log("Updating waiting list status to purchased");
        await ctx.db.patch(waitingListId, {
          status: WAITING_LIST_STATUS.PURCHASED,
        });
  
        console.log("Processing queue for next person");
        // Process queue for next person
        await processQueue(ctx, { eventId });
  
        console.log("Purchase ticket completed successfully");
      } catch (error) {
        console.error("Failed to complete ticket purchase:", error);
        throw new Error(`Failed to complete ticket purchase: ${error}`);
      }
    },
  });
export const joinWaitingList = mutation({
    args:{
        eventId:v.id("events"),
        userId : v.string()
    },handler: async (ctx,{userId,eventId})=>{
        const eventEntry =await ctx.db.query("waitingList")
        .withIndex("by_user_event", q=> q.eq("userId",userId).eq("eventId",eventId))
        .filter(q=> q.neq(q.field("status"),WAITING_LIST_STATUS.EXPIRED))
        .first();

        if (eventEntry){
            throw new Error("You have already joined the waiting list for this event");
        }

        const event = await ctx.db.get(eventId);
        if (!event) throw new Error("Event not found");
        const now = Date.now();
        const {isSoldOut} = await getAvailableEvent(ctx,{eventId});
        if (!isSoldOut){
            const waitingListId = await ctx.db.insert("waitingList",{
                eventId,
                userId,
                status:WAITING_LIST_STATUS.OFFERED,
                offerExpiresAt: now + DURATIONS.TICKET_OFFER
            })

            await ctx.scheduler.runAfter(
                DURATIONS.TICKET_OFFER,
                internal.waiting.expireOffer,{
                    waitingListId,
                    eventId
                }
            )
        }else{
            await ctx.db.insert("waitingList",{
                eventId,
                userId,
                status:WAITING_LIST_STATUS.WAITING
            })
        }

        return {
            success: true,
            status: isSoldOut ? WAITING_LIST_STATUS.WAITING : WAITING_LIST_STATUS.OFFERED,
            message: isSoldOut ? "Event is sold out. You have been added to the waiting list" : `You are next in line for ${DURATIONS.TICKET_OFFER / (60 * 1000) } minutes `
        }

        
    }
})
export const cancelEvent = mutation({
  args:{
    eventId :v.id("events")
  },handler: async(ctx,{eventId})=>{
    await ctx.db.patch(eventId,{is_cancelled:true})
  }
})
export const getAvailableEvent = query({
    args:{
        eventId:v.id("events")
    },handler:async (ctx,{eventId})=>{
        const event = await ctx.db.get(eventId);
        if (!event) throw new Error("Event not found");

        const purchasedCount = await ctx.db.query("tickets").withIndex("by_event",q=>q.eq("eventId",eventId)).collect().then(
            tickets =>
                tickets.filter(t=> t.status === TICKET_STATUS.VALID || t.status === TICKET_STATUS.USED).length
            
        )

        const now = Date.now();
        const activeOffer = await ctx.db.query("waitingList").withIndex("by_event_status",q=> q.eq("eventId",eventId).eq("status",WAITING_LIST_STATUS.OFFERED))
        .collect()
        .then(
            en => en.filter(e=> (e.offerExpiresAt ?? 0)>now ).length
        )

        const totalReserved = purchasedCount + activeOffer;
        return {
            isSoldOut: totalReserved >= event.totalTickets,
            totalTickets: event.totalTickets,
            purchasedCount,
            activeOffer,
            remainingTickets: Math.max(0,event.totalTickets - totalReserved)
        }
    }
})
export const getSellerEvents = query({
    args: { userId: v.string() },
    handler: async (ctx, { userId }) => {
      const events = await ctx.db
        .query("events")
        .filter((q) => q.eq(q.field("userId"), userId))
        .collect();

      const eventsWithMetrics = await Promise.all(
        events.map(async (event) => {
          const tickets = await ctx.db
            .query("tickets")
            .withIndex("by_event", (q) => q.eq("eventId", event._id))
            .collect();
  
          const validTickets = tickets.filter(
            (t) => t.status === "valid" || t.status === "used"
          );
          const refundedTickets = tickets.filter((t) => t.status === "refunded");
          const cancelledTickets = tickets.filter(
            (t) => t.status === "cancelled"
          );
  
          const metrics: Metrics = {
            soldTickets: validTickets.length,
            refundedTickets: refundedTickets.length,
            cancelledTickets: cancelledTickets.length,
            revenue: validTickets.length * event.price,
          };
  
          return {
            ...event,
            metrics,
          };
        })
      );
  
      return eventsWithMetrics;
    },
  });
  
export const getUserTickets = query({
    args: { userId: v.string() },
    handler: async (ctx, { userId }) => {
      const tickets = await ctx.db
        .query("tickets")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
  
      const ticketsWithEvents = await Promise.all(
        tickets.map(async (ticket) => {
          const event = await ctx.db.get(ticket.eventId);
          return {
            ...ticket,
            event,
          };
        })
      );
  
      return ticketsWithEvents;
    },
  });


  export const search = query({
    args:{
      searchParam:v.string()
    },handler :async(ctx,{searchParam})=>{
      const events = await ctx.db.query("events").filter(e=>e.eq(e.field("is_cancelled"),undefined)).collect();

      return events.filter(event=>{
        const searchParamLower = searchParam.toLowerCase();
        return (
          event.name.toLowerCase().includes(searchParamLower)||
          event.location.toLowerCase().includes(searchParamLower)||
          event.description.toLowerCase().includes(searchParamLower)
        )
      })
    }
  })