import { createClient } from "@sanity/client";
import { DEFAULT_CONTACT_EMAIL, fromEmail, getNotificationEmail } from "./shared/contactEmail.js";

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

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

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

const buildPhotoAdminHtml = (data) => {
  const rows = [
    ["Title", data.title],
    ["Submitted By", data.submittedBy],
    ["Email", data.submittedEmail],
    ["Caption", data.caption],
    ["Image Type", data.mimeType],
    ["Image Size", data.sizeLabel],
    ["Sanity ID", data.sanityId],
    ["Image URL", data.imageUrl],
    ["Date Submitted", new Date().toLocaleString("en-US")],
  ]
    .filter(([, v]) => v)
    .map(([label, value]) => `<tr><td style="padding:4px 16px 4px 0;color:#6b7280;font-size:14px;white-space:nowrap;vertical-align:top;">${escapeHtml(label)}:</td><td style="padding:4px 0;color:#111827;font-size:14px;word-break:break-word;">${escapeHtml(value)}</td></tr>`)
    .join("");

  return `<!DOCTYPE html><html><body style="margin:0;padding:20px;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;"><div style="max-width:600px;margin:0 auto;border-radius:8px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);"><div style="background:#1a3a1a;padding:24px;text-align:center;border-radius:8px 8px 0 0;"><h1 style="margin:0;color:#f5c842;font-size:22px;font-family:Georgia,serif;">North Star Santa</h1><p style="margin:8px 0 0;color:#d1fae5;font-size:13px;">New Photo Submission</p></div><div style="padding:28px 24px;background:#ffffff;"><p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#4b5563;">Submission Details</p><table style="border-collapse:collapse;width:100%;">${rows}</table><p style="margin:20px 0 0;font-size:13px;color:#9ca3af;">This photo is pending review in Sanity Studio before being published.</p></div></div></body></html>`;
};

const buildPhotoAdminText = (data) =>
  [
    "NEW PHOTO SUBMISSION",
    "",
    data.title ? `Title: ${data.title}` : "",
    data.submittedBy ? `Submitted By: ${data.submittedBy}` : "",
    data.submittedEmail ? `Email: ${data.submittedEmail}` : "",
    data.caption ? `Caption: ${data.caption}` : "",
    data.mimeType ? `Image Type: ${data.mimeType}` : "",
    data.sizeLabel ? `Image Size: ${data.sizeLabel}` : "",
    data.sanityId ? `Sanity ID: ${data.sanityId}` : "",
    data.imageUrl ? `Image URL: ${data.imageUrl}` : "",
    `Date Submitted: ${new Date().toLocaleString("en-US")}`,
    "",
    "Pending review in Sanity Studio before publishing.",
  ].filter(Boolean).join("\n");

const sendResendEmail = async ({ to, subject, text, html }) => {
  const resendKey = process.env.RESEND_API_KEY;
  const from = fromEmail();
  if (!resendKey) throw new Error("Email service is not configured.");
  if (!from || !to) throw new Error("Email sender or recipient is missing.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, text, html }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Resend failed with status ${response.status}${detail ? `: ${detail.slice(0, 500)}` : ""}`);
  }
};

const sendPhotoNotification = async (client, data) => {
  const admin = await getNotificationEmail(client);
  await sendResendEmail({
    to: admin,
    subject: "New Photo Submission",
    text: buildPhotoAdminText(data),
    html: buildPhotoAdminHtml(data),
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
      sanityId: created._id,
      imageUrl: asset.url,
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
