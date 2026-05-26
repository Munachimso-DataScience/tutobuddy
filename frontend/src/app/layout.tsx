import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

import "react-toastify/dist/ReactToastify.css";

import { AuthProvider } from "@/context/AuthContext";
import { ToastContainer } from "react-toastify";


const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AuraStudy - Personalized Intelligent Learning",
  description: "Your AI-powered university study companion",
  icons: {
    icon: "/favicon.ico",
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${robotoMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <Script id="theme-init" strategy="beforeInteractive">{`
          (function() {
            try {
              var storageKey = 'tutobuddy-theme';
              var theme = localStorage.getItem(storageKey) || 'dark';
              var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              var resolved = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;
              document.documentElement.classList.toggle('dark', resolved === 'dark');
              document.documentElement.style.colorScheme = resolved;
              if (!localStorage.getItem(storageKey)) {
                localStorage.setItem(storageKey, 'dark');
              }
            } catch (error) {}
          })();
        `}</Script>
        <AuthProvider>
          {children}
          <ToastContainer position="bottom-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
