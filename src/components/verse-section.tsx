import Image from "next/image";
import { eventInfo } from "@/lib/seed";

export function VerseSection() {
  return (
    <section
      aria-label="Versículo"
      className="relative overflow-hidden"
    >
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-8 px-5 py-14 text-center sm:px-8 sm:py-16">
        <Image
          src="/images/mae-filhote.png"
          alt="Ganso e filhote"
          width={480}
          height={340}
          className="h-auto w-56 sm:w-72"
        />
        <blockquote>
          <p className="font-display text-xl leading-relaxed text-ink sm:text-2xl">
            “Antes que eu te formasse no ventre{" "}
            <span className="font-script text-[1.35em] text-copper">
              eu te conheci
            </span>
            .”
          </p>
          <footer className="mt-5 font-display text-sm tracking-wide text-ink-soft">
            — {eventInfo.verseReference}
          </footer>
        </blockquote>
      </div>
    </section>
  );
}
