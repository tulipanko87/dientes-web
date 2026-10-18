import { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: "https://dientes.sk/", changeFrequency: "weekly", priority: 1 }];
}
