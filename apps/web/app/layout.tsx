import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "HUK Junge Welt",
  description: "Dein persönlicher Versicherungsüberblick",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={inter.variable} suppressHydrationWarning>
      <body className="antialiased bg-muted overflow-x-hidden">
        <div className="min-h-svh w-full max-w-[430px] mx-auto bg-background overflow-hidden">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
