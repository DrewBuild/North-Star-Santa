import type { VercelRequest, VercelResponse } from "@vercel/node";
import { cleanText, parseDataUrlImage, readJsonBody, sanityWriteClient } from "./_sanity.js";

interface GalleryPhotoPayload {
  title?: string;
  imageDataUrl?: string;
  caption?: string;
  submittedBy?: string;
  submittedEmail?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = await readJsonBody<GalleryPhotoPayload>(req);
    const title = cleanText(body.title, 160);
    const caption = cleanText(body.caption, 1000);
    const submittedBy = cleanText(body.submittedBy, 120);
    const submittedEmail = cleanText(body.submittedEmail, 160);

    if (!body.imageDataUrl) {
      return res.status(400).json({ error: "A photo is required." });
    }

    const client = sanityWriteClient();
    const image = parseDataUrlImage(body.imageDataUrl);
    const asset = await client.assets.upload("image", image.buffer, {
      contentType: image.mimeType,
      filename: `${title || "submitted-photo"}.${image.mimeType.split("/")[1] || "jpg"}`,
    });

    const doc = await client.create({
      _type: "galleryPhoto",
      title: title || "Submitted photo",
      image: {
        _type: "image",
        asset: {
          _type: "reference",
          _ref: asset._id,
        },
      },
      caption: caption || undefined,
      submittedBy: submittedBy || undefined,
      submittedEmail: submittedEmail || undefined,
      approved: false,
      featured: false,
      submittedAt: new Date().toISOString(),
    });

    return res.status(200).json({ id: doc._id });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Could not submit photo.",
    });
  }
}
