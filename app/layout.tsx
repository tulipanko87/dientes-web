import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "Dentálna hygiena Košice | Dientes",

  description:
    "Profesionálna dentálna hygiena v Košiciach. Airflow, odstránenie zubného kameňa, bielenie zubov a starostlivosť o zdravý úsmev.",

  openGraph: {
    title: "Dientes – Dentálna hygiena Košice",

    description:
      "Profesionálna dentálna hygiena v Košiciach.",

    url: "https://dientes.sk",

    siteName: "Dientes",

    locale: "sk_SK",

    type: "website",
  },
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
