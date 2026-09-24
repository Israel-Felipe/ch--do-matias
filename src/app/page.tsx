import { Hero } from "@/components/hero";
import { IntroSection } from "@/components/intro-section";
import { VerseSection } from "@/components/verse-section";
import { EventDetails } from "@/components/event-details";
import { RsvpSection } from "@/components/rsvp-section";
import { GiftList } from "@/components/gift-list";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex-1">
      <Hero />
      <EventDetails />
      <RsvpSection />
      <IntroSection />
      <GiftList />
      <VerseSection />
      <footer className="px-5 py-10 text-center text-xs text-ink-soft sm:px-8">
        <Image
          src="/images/goose-baby.png"
          alt=""
          width={120}
          height={140}
          className="mx-auto mb-3 h-14 w-auto sm:h-16"
        />
        <p className="font-script text-3xl text-copper">Matias</p>
        <p className="mt-2">Com carinho, para celebrar a chegada do nosso bebê.</p>
        <Link
          href="/admin"
          className="mt-4 inline-block text-[0.65rem] uppercase tracking-[0.2em] text-ink-soft/70 hover:text-ink"
        >
          Área da família
        </Link>
      </footer>
    </main>
  );
}
