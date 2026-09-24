import { createClient } from "@sanity/client";
import {
  DEFAULT_CONTACT_EMAIL,
  formatDetailRowsHtml,
  formatDetailRowsText,
  getNotificationEmail,
  sendResendEmail,
  wrapEmailHtml,
} from "./shared/email.js";

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

const parseDataUrlImage = (dataUrl) => {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

  if (!match) {
    throw new Error("Invalid image upload.");
  }

  const [, mimeType, base64] = match;
  const buffer = Buffer.from(base64, "base64");

  if (buffer.length > 5 * 1024 * 1024) {
    throw new Error("Image uploads must be 5MB or smaller.");
  }

  return { buffer, mimeType };
};

const sendPhotoNotification = async (client, data) => {
  const details = [
    ["Title", data.title],
    ["Submitted By", data.submittedBy],
    ["Email", data.submittedEmail],
    ["Caption", data.caption],
    ["Image Type", data.mimeType],
    ["Image Size", data.sizeLabel],
    ["Image URL", data.imageUrl],
    ["Sanity document ID", data.sanityId],
  ];

  await sendResendEmail({
    to: await getNotificationEmail(client),
    subject: "New North Star Santa Photo Submission",
    text: `New Photo Submission\n\n${formatDetailRowsText(details)}`,
    html: wrapEmailHtml("New Photo Submission", formatDetailRowsHtml(details)),
  });
};

export default async function handler(req, res) {
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
    const title = cleanText(body.title, 160);
    const caption = cleanText(body.caption, 1000);
    const submittedBy = cleanText(body.submittedBy, 120);
    const submittedEmail = cleanText(body.submittedEmail, 160);

    if (typeof body.imageDataUrl !== "string") {
      return res.status(400).json({ success: false, error: "A photo is required." });
    }

    const image = parseDataUrlImage(body.imageDataUrl);
    const sizeLabel = `${Math.round(image.buffer.length / 1024)} KB`;

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

    await sendPhotoNotification(client, {
      title: title || "Submitted photo",
      caption,
      submittedBy,
      submittedEmail,
      mimeType: image.mimeType,
      sizeLabel,
      imageUrl: asset.url,
      sanityId: created._id,
    });

    return res.status(200).json({ success: true, id: created._id });
  } catch (error) {
    console.error("Photo handler error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    const emailFailed = /email|resend/i.test(msg);
    return res.status(500).json({
      success: false,
      error: emailFailed
        ? `Could not send notification email to ${DEFAULT_CONTACT_EMAIL}. Please try again or email Santa directly.`
        : "Could not submit photo.",
      detail: msg,
    });
  }
}
