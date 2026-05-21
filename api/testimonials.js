import { createClient } from "@sanity/client";

const projectId = process.env.VITE_SANITY_PROJECT_ID || "wme1a7n3";
const dataset = process.env.VITE_SANITY_DATASET || "production";
const apiVersion = process.env.VITE_SANITY_API_VERSION || "2025-01-01";

const createSanityClient = () =>
  createClient({
    projectId,
    dataset,
    apiVersion,
    token: process.env.SANITY_WRITE_TOKEN,
    useCdn: false,
  });

const readJsonBody = async (req) => {
  if (req.body) return typeof req.body === "string" ? JSON.parse(req.body) : req.body;

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
};

const cleanText = (value, maxLength = 500) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

export default async function handler(req, res) {
  console.log("API hit: testimonials");
  console.log("Sanity project:", projectId);
  console.log("Token exists:", Boolean(process.env.SANITY_WRITE_TOKEN));

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  if (!process.env.SANITY_WRITE_TOKEN) {
    console.error("SANITY_WRITE_TOKEN is not set - writes will fail");
    return res.status(500).json({ success: false, error: "Server configuration error. Please contact the site owner." });
  }

  try {
    const client = createSanityClient();
    const body = await readJsonBody(req);
    const name = cleanText(body.name, 120);
    const email = cleanText(body.email, 160);
    const reviewText = cleanText(body.reviewText, 2000);
    const organization = cleanText(body.organization, 160);
    const location = cleanText(body.location, 160);

    if (!name || !reviewText) {
      return res.status(400).json({ success: false, error: "Name and testimonial are required." });
    }

    console.log("Creating testimonial for:", name);

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

    console.log("testimonial created:", created._id);
    return res.status(200).json({ success: true, id: created._id });
  } catch (error) {
    console.error("Sanity create error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ success: false, error: "Could not submit testimonial.", detail: msg });
  }
}
