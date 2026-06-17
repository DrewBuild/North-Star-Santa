import { createClient } from "@sanity/client";
import { DEFAULT_CONTACT_EMAIL, fromEmail, getNotificationEmail, siteFooterContact } from "./shared/contactEmail.js";

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

const buildTestimonialAdminHtml = (data, contactEmail = DEFAULT_CONTACT_EMAIL) => {
  const header = `
    <div style="background:#1a3a1a;padding:24px;text-align:center;border-radius:8px 8px 0 0;">
      <h1 style="margin:0;color:#f5c842;font-size:22px;font-family:Georgia,serif;">North Star Santa</h1>
      <p style="margin:8px 0 0;color:#d1fae5;font-size:13px;">New Testimonial Submission</p>
    </div>`;
  const rows = [
    ["Name", data.name],
    ["Email", data.email],
    ["Event Type", data.organization],
    ["Location", data.location],
    ["Date Submitted", new Date().toLocaleString("en-US")],
  ]
    .filter(([, v]) => v)
    .map(([l, v]) => `<tr><td style="padding:4px 16px 4px 0;color:#6b7280;font-size:14px;white-space:nowrap;">${escapeHtml(l)}:</td><td style="padding:4px 0;color:#111827;font-size:14px;">${escapeHtml(v)}</td></tr>`)
    .join("");

  const body = `
    <div style="padding:28px 24px;background:#ffffff;">
      <div style="margin-bottom:20px;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#4b5563;">Submission Details</p>
        <table style="border-collapse:collapse;width:100%;">${rows}</table>
      </div>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
      <div>
        <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#4b5563;">Testimonial</p>
        <blockquote style="margin:0;padding:16px;background:#f9fafb;border-left:3px solid #f5c842;border-radius:4px;font-style:italic;color:#374151;font-size:15px;line-height:1.7;">
          "${escapeHtml(data.reviewText)}"
        </blockquote>
      </div>
      <p style="margin:20px 0 0;font-size:13px;color:#9ca3af;">This testimonial is pending review in Sanity Studio before being published.</p>
    </div>
    <div style="background:#f9fafb;padding:12px 24px;border-radius:0 0 8px 8px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">${escapeHtml(siteFooterContact(contactEmail))}</p>
    </div>`;

  return `<!DOCTYPE html><html><body style="margin:0;padding:20px;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;"><div style="max-width:600px;margin:0 auto;border-radius:8px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);">${header}${body}</div></body></html>`;
};

const buildTestimonialAdminText = (data) => {
  return [
    "─".repeat(42),
    "NEW TESTIMONIAL SUBMISSION",
    "─".repeat(42),
    "",
    data.name ? `Name: ${data.name}` : "",
    data.email ? `Email: ${data.email}` : "",
    data.organization ? `Event Type: ${data.organization}` : "",
    data.location ? `Location: ${data.location}` : "",
    `Date Submitted: ${new Date().toLocaleString("en-US")}`,
    "",
    "Testimonial:",
    `"${data.reviewText}"`,
    "",
    "─".repeat(42),
    "Pending review in Sanity Studio before publishing.",
  ].filter((l) => l !== undefined).join("\n");
};

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

const sendTestimonialNotification = async (client, data) => {
  const admin = await getNotificationEmail(client);
  if (!admin) return;

  await sendResendEmail({
    to: admin,
    subject: "New Testimonial Submission",
    text: buildTestimonialAdminText(data),
    html: buildTestimonialAdminHtml(data, admin),
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
    const name = cleanText(body.name, 120);
    const email = cleanText(body.email, 160);
    const reviewText = cleanText(body.reviewText, 2000);
    const organization = cleanText(body.organization, 160);
    const location = cleanText(body.location, 160);

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

    await sendTestimonialNotification(client, { name, email, reviewText, organization, location });

    return res.status(200).json({ success: true, id: created._id });
  } catch (error) {
    console.error("Testimonial handler error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    const emailFailed = /email|resend/i.test(msg);
    return res.status(500).json({
      success: false,
      error: emailFailed
        ? `Could not send notification email to ${DEFAULT_CONTACT_EMAIL}. Please try again or email Santa directly.`
        : "Could not submit testimonial.",
      detail: msg,
    });
  }
}
