import Image from "next/image";
import { Check, Gift } from "lucide-react";
import { eventInfo } from "@/lib/seed";

export function Hero() {
  return (
    <header className="relative flex min-h-[100svh] items-center justify-center overflow-x-clip px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
      {/* Ilustrações principais */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <Image
          src="/images/folhas.png"
          alt=""
          width={420}
          height={340}
          className="absolute top-1 left-0 w-28 opacity-60 sm:top-4 sm:left-2 sm:w-40 lg:top-6 lg:left-6 lg:w-56 lg:opacity-70 xl:w-64"
          priority
        />
        <Image
          src="/images/sol.png"
          alt=""
          width={280}
          height={280}
          className="animate-soft-pulse absolute top-3 right-2 w-14 opacity-90 sm:top-6 sm:right-6 sm:w-20 lg:top-8 lg:right-12 lg:w-32 xl:w-36"
          priority
        />
        <Image
          src="/images/abelha.png"
          alt=""
          width={120}
          height={120}
          className="absolute top-[22%] right-[18%] hidden w-14 opacity-80 lg:block xl:right-[22%] xl:w-16"
        />
        <Image
          src="/images/folhas.png"
          alt=""
          width={420}
          height={340}
          className="absolute right-0 bottom-6 w-24 rotate-180 opacity-50 sm:right-2 sm:bottom-10 sm:w-36 lg:right-8 lg:bottom-8 lg:w-52 lg:opacity-65 xl:w-60"
        />
      </div>

      <div className="relative z-10 w-full max-w-[22.5rem] sm:max-w-md lg:max-w-lg">
        <div className="animate-rise relative rounded-[1.75rem] bg-white/95 px-5 pb-7 pt-8 text-center shadow-[0_18px_50px_-28px_rgba(94,75,60,0.45)] backdrop-blur-[2px] sm:rounded-[2rem] sm:px-8 sm:pb-8 sm:pt-10 lg:px-10 lg:pt-11 lg:pb-9">
          <p className="font-body text-[0.68rem] font-bold tracking-[0.32em] text-copper uppercase sm:text-[0.72rem]">
            — Chá de bebê —
          </p>

          <p className="mt-3 font-script text-2xl leading-none text-copper sm:text-3xl">
            do
          </p>
          <h1 className="mt-1 font-script text-[clamp(3.4rem,16vw,5rem)] leading-[0.88] text-copper">
            {eventInfo.babyName}
          </h1>

          <p className="mx-auto mt-5 max-w-[17rem] font-display text-[0.92rem] leading-relaxed text-ink-soft sm:max-w-xs sm:text-base lg:max-w-sm">
            {eventInfo.subtitle}
          </p>

          <div className="relative mx-auto mt-7 max-w-[16.5rem] border-y border-ink/15 py-3 sm:max-w-xs lg:max-w-sm">
            <Image
              src="/images/abelha.png"
              alt=""
              width={64}
              height={64}
              className="absolute -top-4 right-2 h-7 w-auto sm:right-4 sm:h-8"
            />
            <p className="font-display text-[0.85rem] text-ink sm:text-[0.95rem]">
              <span className="italic">Sábado</span>
              <span className="mx-1.5 text-ink/35">•</span>
              <span>24 de Outubro</span>
              <span className="mx-1.5 text-ink/35">•</span>
              <span>15:00</span>
            </p>
          </div>

          <div className="mt-7 flex flex-col gap-2.5 sm:mt-8">
            <a
              href="#presenca"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-copper px-5 text-sm font-bold text-white shadow-[0_12px_28px_-14px_rgba(193,122,74,0.9)] transition hover:bg-[#b5744a] active:scale-[0.98]"
            >
              <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
              Confirmar presença
            </a>
            <a
              href="#lista"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-sage bg-white px-5 text-sm font-bold text-sage transition hover:bg-sage-soft/40 active:scale-[0.98]"
            >
              <Gift className="h-4 w-4" aria-hidden />
              Sugestões de presentes
            </a>
          </div>
        </div>

        <Image
          src="/images/ganso.png"
          alt=""
          width={510}
          height={864}
          priority
          className="pointer-events-none absolute -bottom-2 -left-6 z-20 w-[42%] max-w-[150px] select-none sm:-bottom-3 sm:-left-10 sm:max-w-[180px] lg:-left-14 lg:max-w-[210px]"
        />
      </div>
    </header>
  );
}
