import type { Metadata, Viewport } from "next";
import { Anton } from "next/font/google";
import "./globals.css";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

export const metadata: Metadata = {
  title: "La Cuadra",
  description: "Casa de amigos, bar de amigos",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23d32f2f'/><text x='50' y='70' font-size='50' font-family='Arial,sans-serif' font-weight='bold' fill='white' text-anchor='middle'>LC</text></svg>",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`h-full ${anton.variable}`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
