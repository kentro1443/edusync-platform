import type { MetadataRoute } from "next";

const routes = [
  "",
  "/solutions",
  "/modules/mentoring",
  "/modules/resources",
  "/modules/appointments",
  "/modules/workflows",
  "/modules/clubs-events",
  "/security",
  "/pricing",
  "/case-studies",
  "/help",
  "/demo",
  "/login",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
