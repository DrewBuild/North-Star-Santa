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

const parseDataUrl = (dataUrl: string) => {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid image upload.");
  const [, mimeType, base64] = match;
  const buffer = Buffer.from(base64, "base64");
  if (buffer.length > 5 * 1024 * 1024) throw new Error("Image uploads must be 5MB or smaller.");
  return { buffer, mimeType };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const body = req.body ?? {};
    const title = clean(body.title, 160);
    const caption = clean(body.caption, 1000);
    const submittedBy = clean(body.submittedBy, 120);
    const submittedEmail = clean(body.submittedEmail, 160);

    if (!body.imageDataUrl) {
      return res.status(400).json({ success: false, error: "A photo is required." });
    }

    const image = parseDataUrl(body.imageDataUrl);
    const asset = await client.assets.upload("image", image.buffer, {
      contentType: image.mimeType,
      filename: `${title || "submitted-photo"}.${image.mimeType.split("/")[1] || "jpg"}`,
    });

    const created = await client.create({
      _type: "galleryPhoto",
      title: title || "Submitted photo",
      image: {
        _type: "image",
        asset: { _type: "reference", _ref: asset._id },
      },
      caption: caption || undefined,
      submittedBy: submittedBy || undefined,
      submittedEmail: submittedEmail || undefined,
      approved: false,
      featured: false,
      submittedAt: new Date().toISOString(),
    });

    return res.status(200).json({ success: true, id: created._id });
  } catch (error) {
    console.error("Photos API error:", error);
    return res.status(500).json({ success: false, error: "Could not submit photo." });
  }
}
