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

const fromEmail = () =>
  process.env.EMAIL_FROM || process.env.FROM_EMAIL || "santa@northstarsanta.com";

const adminEmail = () =>
  process.env.BOOKING_NOTIFICATION_EMAIL || "santa@northstarsanta.com";

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const buildContactHtml = (data) => {
  const header = `
    <div style="background:#1a3a1a;padding:24px;text-align:center;border-radius:8px 8px 0 0;">
      <h1 style="margin:0;color:#f5c842;font-size:22px;font-family:Georgia,serif;">North Star Santa</h1>
      <p style="margin:8px 0 0;color:#d1fae5;font-size:13px;">New Website Inquiry</p>
    </div>`;
  const rows = [
    ["Name", data.name],
    ["Email", data.email],
    ["Phone", data.phone],
    ["Date Submitted", new Date().toLocaleString("en-US")],
  ]
    .filter(([, v]) => v)
    .map(([l, v]) => `<tr><td style="padding:4px 16px 4px 0;color:#6b7280;font-size:14px;white-space:nowrap;">${escapeHtml(l)}:</td><td style="padding:4px 0;color:#111827;font-size:14px;">${escapeHtml(v)}</td></tr>`)
    .join("");

  const body = `
    <div style="padding:28px 24px;background:#ffffff;">
      <div style="margin-bottom:20px;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#4b5563;">Contact Details</p>
        <table style="border-collapse:collapse;width:100%;">${rows}</table>
      </div>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
      <div>
        <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#4b5563;">Message</p>
        <p style="margin:0;padding:16px;background:#f9fafb;border-left:3px solid #f5c842;border-radius:4px;color:#374151;font-size:15px;line-height:1.7;">
          ${escapeHtml(data.message)}
        </p>
      </div>
    </div>
    <div style="background:#f9fafb;padding:12px 24px;border-radius:0 0 8px 8px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">North Star Santa · santa@northstarsanta.com</p>
    </div>`;

  return `<!DOCTYPE html><html><body style="margin:0;padding:20px;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;"><div style="max-width:600px;margin:0 auto;border-radius:8px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);">${header}${body}</div></body></html>`;
};

const buildContactText = (data) => {
  return [
    "─".repeat(42),
    "NEW WEBSITE INQUIRY",
    "─".repeat(42),
    "",
    data.name ? `Name: ${data.name}` : "",
    data.email ? `Email: ${data.email}` : "",
    data.phone ? `Phone: ${data.phone}` : "",
    `Date: ${new Date().toLocaleString("en-US")}`,
    "",
    "Message:",
    data.message,
    "",
    "─".repeat(42),
  ].filter((l) => l !== undefined).join("\n");
};

const sendResendEmail = async ({ to, subject, text, html }) => {
  const resendKey = process.env.RESEND_API_KEY;
  const from = fromEmail();
  if (!resendKey || !from || !to) return;

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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const body = await readJsonBody(req);
    const name = cleanText(body.name, 120);
    const email = cleanText(body.email, 160);
    const phone = cleanText(body.phone, 80);
    const message = cleanText(body.message, 2000);

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: "Name, email, and message are required." });
    }

    const admin = adminEmail();
    if (admin) {
      await sendResendEmail({
        to: admin,
        subject: `New Website Inquiry - ${name}`,
        text: buildContactText({ name, email, phone, message }),
        html: buildContactHtml({ name, email, phone, message }),
      }).catch((err) => console.error("Contact email send failed:", err));
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Contact handler error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ success: false, error: "Could not send message.", detail: msg });
  }
}
