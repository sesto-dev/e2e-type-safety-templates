export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import type { Metadata, Viewport } from "next";
import { redirect } from "next/navigation";
import { Inter } from "next/font/google";

import ThemeProvider from "~/components/shared/theme-provider";
import { Toaster } from "~/components/ui/sonner";
import { siteConfig } from "~/config/site";
import getCurrentUser from "~/lib/server/current-user";

import "./globals.css";


const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter", // exposes a CSS variable
});

const APP_NAME = siteConfig().name;
const APP_DEFAULT_TITLE = siteConfig().name;
const APP_TITLE_TEMPLATE = `%s - ${siteConfig().name}`;
const APP_DESCRIPTION = siteConfig().name;

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersObj = await headers()
  const pathname = headersObj.get("x-invoke-path") || "";
  const user = await getCurrentUser();
  if (!user && !pathname.startsWith("/login")) redirect("/login");
  
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning={true}>
      <head>
        <meta name="theme-color" content="#FFFFFF" />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <Toaster />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
