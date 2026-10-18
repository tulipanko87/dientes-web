import type { Metadata } from "next";
import { site } from "../site-data";
import "./globals.css";

export function generateMetadata(): Metadata {
  const seo = site.seo;
  const title = seo?.title?.trim() || "Dentálna hygiena Košice | Dientes";
  const description = seo?.description?.trim() || "Šetrná dentálna hygiena v Košiciach. Rezervujte si termín online.";
  const socialTitle = seo?.socialTitle?.trim() || title;
  const socialDescription = seo?.socialDescription?.trim() || description;
  const socialImage = seo?.socialImage?.trim() || "/opengraph-image.png";
  return {
    metadataBase: new URL("https://dientes.sk"),
    alternates: { canonical: "/" },
    robots: { index: true, follow: true },
    title,
    description,
    openGraph: {
      title: socialTitle,
      description: socialDescription,
      url: "https://dientes.sk/",
      siteName: "Dientes",
      locale: "sk_SK",
      type: "website",
      images: [{ url: socialImage, alt: socialTitle }],
    },
    twitter: { card: "summary_large_image", title: socialTitle, description: socialDescription, images: [socialImage] },
  };
}

export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return (
    <html lang="sk" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
