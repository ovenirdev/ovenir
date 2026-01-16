import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "OVENIR - Developer Tools, Instant",
  description: "Premium developer toolbox. 100% local, privacy-first. Paste anything, we detect and transform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
