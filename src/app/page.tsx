import { Hero } from "@/components/hero";
import { ClosingFooter } from "@/components/closing-footer";
import { EventDetails } from "@/components/event-details";
import { RsvpSection } from "@/components/rsvp-section";
import { GiftList } from "@/components/gift-list";

export default function HomePage() {
  return (
    <main className="flex-1">
      <Hero />
      <EventDetails />
      <RsvpSection />
      <GiftList />
      <ClosingFooter />
    </main>
  );
}
