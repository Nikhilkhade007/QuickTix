"use client";

import { useState } from "react";
import { Ban } from "lucide-react";
import {refundEventTickets} from "@/actions/refundEventTickets"
import { Id } from "@/convex/_generated/dataModel";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";

export default function CancelEventButton({
  eventId,
}: {
  eventId: Id<"events">;
}) {
  const [isCancelling, setIsCancelling] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
//   const cancelEvent = useMutation(api.events.cancelEvent);

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await refundEventTickets(eventId);
    //   await cancelEvent({ eventId });
      toast({
        title: "Event cancelled",
        description: "All tickets have been refunded successfully.",
      });
      router.push("/seller/events");
    } catch (error) {
      console.error("Failed to cancel event:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to cancel event. Please try again.",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <Dialog>
        <DialogTrigger asChild>
            <div className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">
            <Ban className="w-4 h-4" />
              <span>{isCancelling ? "Processing..." : "Cancel Event"}</span>  
            </div>
        </DialogTrigger>
        <DialogContent>
            <DialogTitle>
                Are you sure to cancel Event?
            </DialogTitle>
            <DialogDescription>
                All tickets will be refunded and the event will be cancelled permanently.
            </DialogDescription>
            <DialogFooter>
                <Button variant={"destructive"}  onClick={handleCancel} disabled={isCancelling}>
                    Yes
                </Button>
                <DialogClose asChild>
                    <Button>
                        Close
                    </Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}
