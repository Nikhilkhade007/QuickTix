import Carousel from "@/components/Carosel";
import EventList from "@/components/EventList";

export default function Home() {
  return (
    <div className="mt-8 sm:mt-0">
      <Carousel/>
      <EventList/>
    </div>
  );
}
