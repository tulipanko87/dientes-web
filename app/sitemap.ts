import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://dientes.sk",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}