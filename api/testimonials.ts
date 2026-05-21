import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.VITE_SANITY_PROJECT_ID || "wme1a7n3",
  dataset: process.env.VITE_SANITY_DATASET || "production",
  apiVersion: process.env.VITE_SANITY_API_VERSION || "2025-01-01",
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

const clean = (value: unknown, max = 500) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const body = req.body ?? {};
    const name = clean(body.name, 120);
    const email = clean(body.email, 160);
    const reviewText = clean(body.reviewText, 2000);
    const organization = clean(body.organization, 160);
    const location = clean(body.location, 160);

    if (!name || !reviewText) {
      return res.status(400).json({ success: false, error: "Name and testimonial are required." });
    }

    const created = await client.create({
      _type: "testimonial",
      name,
      email: email || undefined,
      reviewText,
      organization: organization || undefined,
      location: location || undefined,
      approved: false,
      featured: false,
      submittedAt: new Date().toISOString(),
    });

    return res.status(200).json({ success: true, id: created._id });
  } catch (error) {
    console.error("Testimonial API error:", error);
    return res.status(500).json({ success: false, error: "Could not submit testimonial." });
  }
}
