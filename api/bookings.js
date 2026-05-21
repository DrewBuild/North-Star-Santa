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

const normalizeDate = (dateValue) => {
  if (!dateValue) return "";
  return dateValue.slice(0, 10);
};

const getMonthDay = (dateString) => {
  const normalized = normalizeDate(dateString);
  return normalized ? normalized.slice(5, 10) : "";
};

const isDateInBlockout = (selectedDate, blockout) => {
  const selected = normalizeDate(selectedDate);
  if (!selected || !blockout) return false;

  const selectedMD = getMonthDay(selected);
  const start = normalizeDate(blockout.startDate);
  const end = normalizeDate(blockout.endDate || blockout.startDate);

  if (!start) return false;

  if (blockout.repeatYearly) {
    const startMD = getMonthDay(start);
    const endMD = getMonthDay(end);
    if (!endMD || startMD === endMD) return selectedMD === startMD;
    if (startMD < endMD) return selectedMD >= startMD && selectedMD <= endMD;
    return selectedMD >= startMD || selectedMD <= endMD;
  }

  return selected >= start && selected <= end;
};

const isDateBlocked = (selectedDate, blockouts) =>
  Boolean(selectedDate && blockouts.some((blockout) => blockout.isFullDay !== false && isDateInBlockout(selectedDate, blockout)));

const isTimeBlocked = (selectedDate, selectedTime, blockouts) => {
  const normalizedTime = selectedTime.slice(0, 5);
  if (!selectedDate || !normalizedTime) return false;

  return blockouts.some((blockout) => {
    if (blockout.isFullDay !== false || !isDateInBlockout(selectedDate, blockout)) return false;

    const startTime = (blockout.startTime || "").slice(0, 5);
    const endTime = (blockout.endTime || "").slice(0, 5);

    if (!startTime && !endTime) return false;
    if (startTime && !endTime) return normalizedTime === startTime;
    if (!startTime && endTime) return normalizedTime < endTime;
    return normalizedTime >= startTime && normalizedTime < endTime;
  });
};

const eventTypeMap = {
  "Private Home Visit": "Home Visit",
  "Hospital Visit": "Hospital Event",
  "Community Event / Parade": "Community Event",
  "HOA / Neighborhood Event": "Community Event",
  "Breakfast / Lunch / Dinner with Santa": "Other",
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const detailRows = (details) =>
  details
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "")
    .map(([label, value]) => `${label}: ${String(value).trim()}`)
    .join("\n");

const detailRowsHtml = (details) =>
  details
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "")
    .map(([label, value]) => `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`)
    .join("");

const sendResendEmail = async ({ to, subject, text, html }) => {
  if (!process.env.RESEND_API_KEY || !process.env.FROM_EMAIL || !to) return;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL,
      to,
      subject,
      text,
      html,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Resend failed with status ${response.status}${detail ? `: ${detail.slice(0, 500)}` : ""}`);
  }
};

const sendBookingEmails = async ({ booking, sanityId }) => {
  const details = [
    ["Name", booking.fullName],
    ["Email", booking.email],
    ["Phone", booking.phone],
    ["Event type", booking.eventType],
    ["Date", booking.eventDate],
    ["Time", booking.eventTime],
    ["Location", booking.eventLocation],
    ["Guests/children", booking.numberOfGuests],
    ["Notes", booking.message],
    ["Sanity document ID", sanityId],
  ];
  const textSummary = detailRows(details);
  const htmlSummary = detailRowsHtml(details);
  const messages = [];

  if (process.env.BOOKING_NOTIFICATION_EMAIL) {
    messages.push(
      sendResendEmail({
        to: process.env.BOOKING_NOTIFICATION_EMAIL,
        subject: "New North Star Santa Booking Request",
        text: `A new North Star Santa booking request was submitted.\n\n${textSummary}`,
        html: `<p>A new North Star Santa booking request was submitted.</p>${htmlSummary}`,
      }),
    );
  }

  if (booking.email) {
    messages.push(
      sendResendEmail({
        to: booking.email,
        subject: "North Star Santa received your booking request",
        text: `Thank you for your North Star Santa booking request. Santa will follow up soon.\n\n${textSummary}`,
        html: `<p>Thank you for your North Star Santa booking request. Santa will follow up soon.</p>${htmlSummary}`,
      }),
    );
  }

  const results = await Promise.allSettled(messages);
  results.forEach((result) => {
    if (result.status === "rejected") {
      console.error("Booking email notification failed:", result.reason);
    }
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
    const fullName = cleanText(body.fullName, 160);
    const email = cleanText(body.email, 160);
    const phone = cleanText(body.phone, 80);
    const rawEventType = cleanText(body.eventType, 120);
    const eventType = eventTypeMap[rawEventType] || rawEventType || "Other";
    const eventDate = cleanText(body.eventDate, 20);
    const eventTime = cleanText(body.eventTime, 20);
    const eventLocation = cleanText(body.eventLocation, 1000);
    const message = cleanText(body.message, 2000);
    const numberOfGuests = Number(body.numberOfGuests || 0);

    if (!fullName || !email) {
      return res.status(400).json({ success: false, error: "Full name and email are required." });
    }

    if (eventDate) {
      const blockouts = await client.fetch(
        `*[_type == "blockoutDate" && active != false]{ isFullDay, startDate, endDate, startTime, endTime, repeatYearly }`,
      );

      if (isDateBlocked(eventDate, blockouts)) {
        return res.status(400).json({
          success: false,
          error: "Santa is unavailable on this date. Please choose another date.",
        });
      }
      if (eventTime && isTimeBlocked(eventDate, eventTime, blockouts)) {
        return res.status(400).json({
          success: false,
          error: "That time is unavailable. Please choose another time.",
        });
      }
    }

    const booking = {
      _type: "bookingRequest",
      fullName,
      email,
      phone: phone || "",
      eventType,
      eventDate: eventDate || null,
      eventTime: eventTime || "",
      eventLocation: eventLocation || "",
      numberOfGuests: Number.isFinite(numberOfGuests) && numberOfGuests > 0 ? numberOfGuests : undefined,
      message: message || "",
      status: "New",
      submittedAt: new Date().toISOString(),
    };

    const created = await client.create(booking);

    await sendBookingEmails({ booking, sanityId: created._id });

    return res.status(200).json({ success: true, id: created._id });
  } catch (error) {
    console.error("Sanity create error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ success: false, error: "Could not send booking request.", detail: msg });
  }
}
