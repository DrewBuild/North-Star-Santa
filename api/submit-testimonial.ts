import type { VercelRequest, VercelResponse } from "@vercel/node";
import { cleanText, readJsonBody, sanityWriteClient } from "./_sanity";

interface TestimonialPayload {
  name?: string;
  email?: string;
  reviewText?: string;
  organization?: string;
  location?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = await readJsonBody<TestimonialPayload>(req);
    const name = cleanText(body.name, 120);
    const email = cleanText(body.email, 160);
    const reviewText = cleanText(body.reviewText, 2000);
    const organization = cleanText(body.organization, 160);
    const location = cleanText(body.location, 160);

    if (!name || !reviewText) {
      return res.status(400).json({ error: "Name and testimonial are required." });
    }

    const doc = await sanityWriteClient().create({
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

    return res.status(200).json({ id: doc._id });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Could not submit testimonial.",
    });
  }
}
