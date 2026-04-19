import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Tajawal, Inter } from "next/font/google";
import AppHeader from "@/components/layout/AppHeader";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700", "800", "900"],
  variable: "--font-arabic",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-latin",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AlemnyPro — Expert Mentors. Guaranteed Growth.",
  description: "Find the best verified tutors in Egypt. Private lessons online and in-person for Math, Science, English, Coding, and more. Verified tutors with background checks.",
  keywords: "tutoring, private lessons, Egypt, math tutor, English tutor, online tutoring, Thanaweya, IGCSE, مدرس خصوصي, دروس خصوصية, مصر",
  openGraph: {
    title: "AlemnyPro — Expert Mentors. Guaranteed Growth.",
    description: "Find the best verified tutors in Egypt.",
    type: "website",
    locale: "ar_EG",
    alternateLocale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className={`${tajawal.variable} ${inter.variable}`}>
      <body className={tajawal.className}>
        <Providers>
          <AppHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
