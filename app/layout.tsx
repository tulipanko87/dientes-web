import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "Dientes dentálna hygiena",
  description: "Profesionálna dentálna hygiena Dientes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sk"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
