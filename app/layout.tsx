import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Image from "next/image";
import Link from "next/link";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UFV – Gestion des chargements",
  description: "Application test recrutement interne Next.js + Supabase",
};

const CONTAINER = "max-w-6xl mx-auto w-full px-6";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gray-50 text-gray-900 flex flex-col`}
      >
        {/* Mon header avec logo et titre */}
        <header className="border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="max-w-6xl mx-auto w-full px-6">
            <div className="grid grid-cols-3 items-center py-2">
              {" "}
              <div className="flex items-center min-w-0">
                <Link href="/" className="inline-flex items-center">
                  <Image
                    src="/sud-bois-logo.jpg"
                    alt="Logo UFV"
                    width={60}
                    height={60}
                    className="rounded-md object-contain shrink-0"
                    priority
                  />
                </Link>
              </div>
              {/* Je centre mon titre - Titre mobile plus court */}
              <Link href="/chargements" className="text-center min-w-0">
                  <h1 className="sm:hidden text-sm font-semibold leading-tight">
                    UFV - Chargements
                  </h1>
                  <h1 className="hidden sm:block text-base sm:text-lg font-semibold tracking-tight leading-tight">
                    UFV - Gestion des chargements
                  </h1>
              </Link>
              {/* droite : espace miroir afin de centrer logo/titre */}
              <div className="flex items-center justify-end">
                <span className="inline-block h-9 w-9" aria-hidden />
              </div>
            </div>
          </div>
        </header>

        {/* Main : contenu de la page/component chargé */}
        <main className="flex-1 w-full">
          <div className={`${CONTAINER} py-6`}>{children}</div>
        </main>

        {/* Footer commun à toutes les pages */}
        <footer className="border-t bg-white text-center py-3 text-sm text-gray-500">
          © {new Date().getFullYear()} UFV — Next.js · Supabase · Tailwind ·
          shadcn/ui
        </footer>
      </body>
    </html>
  );
}
