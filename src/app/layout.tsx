import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { SocketProvider } from "@/context/SocketContext";

export const metadata: Metadata = {
  title: "Hello Chat",
  description: "We care about you!, Always talk with your family and friends",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
      >
        <AppProvider>
          <SocketProvider>
            {children}
          </SocketProvider>
        </AppProvider>
      </body>
    </html>
  );
}
