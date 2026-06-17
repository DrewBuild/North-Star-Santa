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
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
};

const cleanText = (value, maxLength = 500) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const client = createSanityClient();
    const body = await readJsonBody(req);
    const name = cleanText(body.name, 120);
    const email = cleanText(body.email, 160);
    const phone = cleanText(body.phone, 80);
    const preferredContactMethod = cleanText(body.preferredContactMethod, 80);
    const message = cleanText(body.message, 2000);

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: "Name, email, and message are required." });
    }

    const details = [
      ["Name", name],
      ["Email", email],
      ["Phone", phone],
      ["Preferred Contact Method", preferredContactMethod],
      ["Message", message],
    ];

    await sendResendEmail({
      to: await getNotificationEmail(client),
      subject: "New North Star Santa Contact Request",
      text: `New Contact Santa Request\n\n${formatDetailRowsText(details)}`,
      html: wrapEmailHtml("New Contact Santa Request", formatDetailRowsHtml(details)),
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Contact handler error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    const emailFailed = /email|resend/i.test(msg);
    return res.status(500).json({
      success: false,
      error: emailFailed
        ? `Could not send notification email to ${DEFAULT_CONTACT_EMAIL}. Please try again or email Santa directly.`
        : "Could not send message.",
      detail: msg,
    });
  }
}
