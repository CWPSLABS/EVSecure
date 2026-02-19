import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EVSecure - Secure Environment Variable Manager",
  description: "Securely store, manage and sync your API keys and .env files with AES-256 encryption. Zero-knowledge encryption means we never see your secrets. Free to use.",
  keywords: [
    "environment variable manager",
    "env file manager",
    "api key storage",
    "secure secrets manager",
    "dotenv manager",
    "api key manager",
    "environment variables",
    "secure env storage",
    "developer tools",
    "encrypt api keys",
  ],
  authors: [{ name: "EVSecure", url: "https://evsecure-six.vercel.app" }],
  creator: "EVSecure",
  metadataBase: new URL("https://evsecure-six.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "https://evsecure-six.vercel.app",
    siteName: "EVSecure",
    title: "EVSecure - Secure Environment Variable Manager",
    description: "Securely store, manage and sync your API keys and .env files with AES-256 encryption. Zero-knowledge — we never see your secrets.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "EVSecure - Secure Environment Variable Manager",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EVSecure - Secure Environment Variable Manager",
    description: "Securely store, manage and sync your API keys with AES-256 encryption. Zero-knowledge encryption — we never see your secrets.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-H2EEK5E5YS"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-H2EEK5E5YS');
          `}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
