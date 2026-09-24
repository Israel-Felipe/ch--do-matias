import Image from "next/image";
import Link from "next/link";
import { eventInfo } from "@/lib/seed";

export function ClosingFooter() {
  return (
    <footer className="px-5 py-10 text-center text-xs text-ink-soft sm:px-8">
      <Link
        href="/admin"
        className="mx-auto mb-3 inline-block outline-none transition opacity-90 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-copper/40 focus-visible:ring-offset-2"
        aria-label="Área da família"
      >
        <Image
          src="/images/goose-baby.png"
          alt=""
          width={120}
          height={140}
          className="h-14 w-auto sm:h-16"
        />
      </Link>
      <p className="font-script text-3xl text-copper">{eventInfo.babyName}</p>
      <p className="mt-2">
        Com carinho, para celebrar o nosso bebê que está a caminho.
      </p>
    </footer>
  );
}
