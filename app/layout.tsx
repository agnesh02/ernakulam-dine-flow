import type { Metadata } from "next";
import { Providers } from "./providers";
import "./styles/globals.css";

export const metadata: Metadata = {
  title: "RestaurantOS - A Modern Restaurant Management System",
  description: "Professional restaurant management system with staff dashboard and customer PWA for seamless dine-in experiences",
  authors: [{ name: "RestaurantOS" }],
  openGraph: {
    title: "RestaurantOS - Modern Restaurant Management System",
    description: "Professional restaurant management system with staff dashboard and customer PWA for seamless dine-in experiences",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@agnesh02backup",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

