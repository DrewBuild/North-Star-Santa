import type { VercelRequest, VercelResponse } from "@vercel/node";
import { cleanText, parseDataUrlImage, readJsonBody, sanityProjectId, sanityWriteClient } from "./_sanity";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("API hit: photos");
  console.log("Sanity project:", sanityProjectId);
  console.log("Token exists:", Boolean(process.env.SANITY_WRITE_TOKEN));

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  if (!process.env.SANITY_WRITE_TOKEN) {
    console.error("SANITY_WRITE_TOKEN is not set — writes will fail");
    return res.status(500).json({ success: false, error: "Server configuration error. Please contact the site owner." });
  }

  try {
    const client = sanityWriteClient();
    const body = await readJsonBody<Record<string, unknown>>(req);
    const title = cleanText(body.title, 160);
    const caption = cleanText(body.caption, 1000);
    const submittedBy = cleanText(body.submittedBy, 120);
    const submittedEmail = cleanText(body.submittedEmail, 160);

    if (typeof body.imageDataUrl !== "string") {
      return res.status(400).json({ success: false, error: "A photo is required." });
    }

    const image = parseDataUrlImage(body.imageDataUrl);

    console.log("Uploading photo asset for:", submittedBy || "anonymous");

    const asset = await client.assets.upload("image", image.buffer, {
      contentType: image.mimeType,
      filename: `${title || "submitted-photo"}.${image.mimeType.split("/")[1] || "jpg"}`,
    });

    console.log("Photo asset uploaded:", asset._id, "— creating galleryPhoto document");

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

    console.log("galleryPhoto created:", created._id);
    return res.status(200).json({ success: true, id: created._id });
  } catch (error) {
    console.error("Sanity create error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ success: false, error: "Could not submit photo.", detail: msg });
  }
}
