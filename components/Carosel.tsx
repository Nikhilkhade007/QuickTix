"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useStorageUrl } from "@/lib/utils";
import Link from "next/link"; 

export default function Carousel() {
    const currentDate =new Date();
  const AllEvents = useQuery(api.events.get);
  const events = AllEvents
  ?.filter(event => new Date(event.eventDate) >= currentDate)
  .slice(0, 5) || [];
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % (events?.length || 1));
  }, [events?.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + (events?.length || 1)) % (events?.length || 1));
  }, [events?.length]);

  useEffect(() => {
    const interval = setInterval(nextSlide, 5000); // Change slide every 3 seconds
    return () => clearInterval(interval);
  }, [nextSlide]);

  return (
    <div className="relative max-w-7xl mx-auto px-4 pt-14 h-[500px]">
      <div className="overflow-hidden rounded-3xl shadow-lg h-full">
        <div
          className="flex transition-transform duration-500 ease-in-out h-full"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {events?.map((event) => (
            <CarouselCard key={event._id} event={event} />
          ))}
        </div>
      </div>
      <Button
        variant="outline"
        size="icon"
        className="absolute top-1/2 left-6 transform -translate-y-1/2 bg-white/80 hover:bg-white"
        onClick={prevSlide}
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="absolute top-1/2 right-6 transform -translate-y-1/2 bg-white/80 hover:bg-white"
        onClick={nextSlide}
        aria-label="Next slide"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <div className="absolute bottom-14 left-0 right-0">
        <div className="flex items-center justify-center gap-2">
          {events?.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                index === currentIndex ? "bg-white" : "bg-white/50"
              }`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const CarouselCard = ({ event }:{event:any}) => {
  const imageUrl = useStorageUrl(event?.imageStorageId);
  return (
    <div className=" w-full flex-shrink-0 flex flex-row-reverse items-center h-full">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={event.name}
          width={600}
          height={400}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-red-200 flex items-center justify-center rounded-lg">
          <span className="text-red-600 font-semibold">Image not available</span>
        </div>
      )}
      <div className="w-[40%] flex flex-col justify-center px-4">
        <h3 className="text-lg font-semibold mt-4">{event.name}</h3>
        <p className="text-gray-600 text-center mt-2">{event.shortDescription}</p>
        <Link href={`/event/${event._id}`} passHref>
          <Button className="mt-4">View Event</Button>
        </Link>
      </div>
    </div>
  );
};