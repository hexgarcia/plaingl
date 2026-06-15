import type { Metadata } from "next";
import "./app.css";

export const metadata: Metadata = {
  title: "PlainGL.com",
  description: "Plain-text general ledger accounting — QuickBooks-style reports you own.",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
