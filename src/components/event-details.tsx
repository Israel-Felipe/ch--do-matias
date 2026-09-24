import Image from "next/image";
import { CalendarDays, Clock3, MapPin, MessageCircleHeart } from "lucide-react";
import { eventInfo } from "@/lib/seed";

const items = [
  {
    icon: CalendarDays,
    label: "Data",
    value: eventInfo.dateLabel,
  },
  {
    icon: Clock3,
    label: "Horário",
    value: eventInfo.timeLabel,
  },
] as const;

export function EventDetails() {
  return (
    <section className="mx-auto w-full max-w-2xl px-5 py-12 sm:px-8 sm:py-14">
      <div className="text-center">
        <Image
          src="/images/folhas.png"
          alt=""
          width={160}
          height={120}
          className="mx-auto mb-3 h-10 w-auto opacity-70"
        />
        <h2 className="font-script text-4xl text-copper sm:text-5xl">O encontro</h2>
        <p className="mt-2 text-sm text-ink-soft sm:text-base">
          Celebre conosco o Matias que está a caminho
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 text-center">
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} className="space-y-1">
            <Icon className="mx-auto h-5 w-5 text-sage" aria-hidden />
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-ink-soft">
              {label}
            </p>
            <p className="font-display text-base text-ink sm:text-lg">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-1 text-center">
        <MapPin className="mx-auto h-5 w-5 text-sage" aria-hidden />
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-ink-soft">
          Local
        </p>
        <p className="font-display text-lg text-ink">{eventInfo.locationLabel}</p>
        <p className="text-sm text-ink-soft">{eventInfo.addressArea}</p>
        <p className="text-sm text-ink-soft">{eventInfo.addressStreet}</p>
        <a
          href={eventInfo.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex min-h-10 items-center text-sm font-bold text-copper underline-offset-4 hover:underline"
        >
          Abrir no Maps
        </a>
      </div>

      <div className="mt-8 space-y-1 text-center">
        <MessageCircleHeart className="mx-auto h-5 w-5 text-sage" aria-hidden />
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-ink-soft">
          Confirmação
        </p>
        <p className="font-display text-lg text-ink">{eventInfo.rsvpLabel}</p>
        <a
          href="#presenca"
          className="mt-2 inline-flex min-h-10 items-center text-sm font-bold text-ink underline-offset-4 hover:underline"
        >
          Confirmar presença →
        </a>
      </div>
    </section>
  );
}
