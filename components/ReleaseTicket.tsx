"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useState } from "react";
import { XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTrigger } from "./ui/dialog";
import { DialogClose, DialogTitle } from "@radix-ui/react-dialog";
import { Button } from "./ui/button";

export default function ReleaseTicket({
  eventId,
  waitingListId,
}: {
  eventId: Id<"events">;
  waitingListId: Id<"waitingList">;
}) {
  const [isReleasing, setIsReleasing] = useState(false);
  const releaseTicket = useMutation(api.waiting.releaseTicket);

  const handleRelease = async () => {
    try {
      setIsReleasing(true);
      await releaseTicket({
        eventId,
        waitingListId,
      });
    } catch (error) {
      console.error("Error releasing ticket:", error);
    } finally {
      setIsReleasing(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
          <div
          
          className="mt-2 w-full flex items-center justify-center gap-2 py-2 px-4 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <XCircle className="w-4 h-4" />
          {isReleasing ? "Releasing..." : "Release Ticket Offer"}
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Are sure to release ticket?</DialogTitle>
        <DialogDescription>
          If you release ticket then it will be allocated to the another user
        </DialogDescription>
        <DialogFooter>
          <Button onClick={handleRelease}
          disabled={isReleasing} type="submit" variant={"destructive"}>
            Confirm
          </Button>
          <DialogClose asChild>
            <Button variant={"outline"} >
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}