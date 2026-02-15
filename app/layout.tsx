import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EnvVault - Secure Environment Variable Manager",
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
  authors: [{ name: "EnvVault", url: "https://env-vault-six.vercel.app" }],
  creator: "EnvVault",
  metadataBase: new URL("https://env-vault-six.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "https://env-vault-six.vercel.app",
    siteName: "EnvVault",
    title: "EnvVault - Secure Environment Variable Manager",
    description: "Securely store, manage and sync your API keys and .env files with AES-256 encryption. Zero-knowledge — we never see your secrets.",
    images: [
      {
        url: "/og-image.png", 
        width: 1200,
        height: 630,
        alt: "EnvVault - Secure Environment Variable Manager",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EnvVault - Secure Environment Variable Manager",
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
