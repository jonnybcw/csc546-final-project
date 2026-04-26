import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orion",
  description: "Personalized language learning from your own context."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="orion-bg fixed inset-0 -z-10" />
        {children}
      </body>
    </html>
  );
}
