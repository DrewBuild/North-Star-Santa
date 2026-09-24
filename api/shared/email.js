export const DEFAULT_CONTACT_EMAIL = "Santa@northstarsanta.com";

export const fromEmail = () =>
  process.env.EMAIL_FROM || process.env.FROM_EMAIL || DEFAULT_CONTACT_EMAIL;

export const getNotificationEmail = async (client) => {
  try {
    const settings = await client.fetch(
      `*[_type == "siteSettings" && !(_id in path("drafts.**"))][0]{ contactEmail }`,
    );
    const contactEmail = settings?.contactEmail?.trim();
    if (contactEmail) return contactEmail;
  } catch (error) {
    console.error("Could not load site contact email:", error);
  }

  return process.env.CONTACT_EMAIL || process.env.BOOKING_NOTIFICATION_EMAIL || DEFAULT_CONTACT_EMAIL;
};

export const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export const formatDetailRowsText = (details) =>
  details
    .map(([label, value]) => `${label}: ${value === undefined || value === null || String(value).trim() === "" ? "" : String(value).trim()}`)
    .join("\n");

export const formatDetailRowsHtml = (details) =>
  `<table style="border-collapse:collapse;width:100%;">${details
    .map(
      ([label, value]) =>
        `<tr><td style="padding:5px 18px 5px 0;color:#6b7280;font-size:14px;white-space:nowrap;vertical-align:top;"><strong>${escapeHtml(label)}:</strong></td><td style="padding:5px 0;color:#111827;font-size:14px;white-space:pre-line;vertical-align:top;">${escapeHtml(value === undefined || value === null ? "" : value)}</td></tr>`,
    )
    .join("")}</table>`;

export const wrapEmailHtml = (title, rowsHtml) => `
  <!DOCTYPE html>
  <html>
    <body style="margin:0;padding:20px;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:640px;margin:0 auto;border-radius:8px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);">
        <div style="background:#1a3a1a;padding:24px;text-align:center;">
          <h1 style="margin:0;color:#f5c842;font-size:22px;font-family:Georgia,serif;">North Star Santa</h1>
          <p style="margin:8px 0 0;color:#d1fae5;font-size:13px;">${escapeHtml(title)}</p>
        </div>
        <div style="padding:28px 24px;background:#ffffff;">
          ${rowsHtml}
        </div>
      </div>
    </body>
  </html>`;

export const sendResendEmail = async ({ to, subject, text, html }) => {
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
