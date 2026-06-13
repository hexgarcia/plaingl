import type { Metadata } from "next";
import "./app.css";

export const metadata: Metadata = {
  title: "BeanBooks",
  description: "A Beancount accounting workspace.",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
