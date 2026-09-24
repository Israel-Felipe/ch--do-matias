import type { Metadata, Viewport } from "next";
import { Great_Vibes, Lora, Nunito } from "next/font/google";
import "./globals.css";

const script = Great_Vibes({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-script",
  display: "swap",
});

const display = Lora({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = Nunito({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chá do Matias",
  description:
    "Chá de bebê do Matias — 24 de outubro, 15h, auditório da FLT. Confira as sugestões de presentes.",
  openGraph: {
    title: "Chá do Matias",
    description:
      "Celebre o Matias que está a caminho e o aniversário do papai. 24/10 às 15h no auditório da FLT.",
    locale: "pt_BR",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f3ec",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${script.variable} ${display.variable} ${body.variable} h-full`}
    >
      <body className="paper-bg relative flex min-h-full flex-col">
        <div className="paper-wash pointer-events-none fixed inset-0 -z-10" aria-hidden />
        {children}
      </body>
    </html>
  );
}
