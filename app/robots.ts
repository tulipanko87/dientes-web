import { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/"] },
    sitemap: "https://dientes.sk/sitemap.xml",
    host: "https://dientes.sk",
  };
}
