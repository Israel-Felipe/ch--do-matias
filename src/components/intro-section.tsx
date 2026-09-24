import Image from "next/image";
import { eventInfo } from "@/lib/seed";

export function IntroSection() {
  return (
    <section className="mx-auto w-full max-w-2xl px-5 py-10 sm:px-8 sm:py-12">
      <div className="text-center">
        <Image
          src="/images/folhas.png"
          alt=""
          width={140}
          height={110}
          className="mx-auto mb-3 h-9 w-auto opacity-75"
        />
        <h2 className="font-script text-3xl text-copper sm:text-4xl">Com carinho</h2>
        <p className="mt-4 text-sm leading-relaxed text-ink-soft sm:text-base">
          {eventInfo.intro}
        </p>
      </div>
    </section>
  );
}
