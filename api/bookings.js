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
  Boolean(selectedDate && blockouts.some((b) => b.isFullDay !== false && isDateInBlockout(selectedDate, b)));

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

// ─── Travel buffer helpers ─────────────────────────────────────────────────

const timeToMinutes = (time) => {
  if (!time) return 0;
  const [h, m] = time.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
};

const minutesToTime = (minutes) => {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
};

const computeTravelBuffer = (eventTime, durationMinutes, scheduleEndTime) => {
  const startMinutes = timeToMinutes(eventTime);
  const appointmentEndMinutes = startMinutes + durationMinutes;
  const scheduleEndMinutes = timeToMinutes(scheduleEndTime);
  const travelBufferMinutes = appointmentEndMinutes >= scheduleEndMinutes ? 0 : 60;
  return {
    appointmentEndTime: minutesToTime(appointmentEndMinutes),
    travelBufferMinutes,
    blockedStartTime: eventTime.slice(0, 5),
    blockedEndTime: minutesToTime(appointmentEndMinutes + travelBufferMinutes),
    scheduleEndTime: scheduleEndTime ? scheduleEndTime.slice(0, 5) : "",
    isEndOfDayBooking: travelBufferMinutes === 0,
  };
};

const hasOverlapWithExistingBookings = (newStart, newEnd, existingBookings, selectedDate, scheduleEndTime) => {
  const newStartMin = timeToMinutes(newStart);
  const newEndMin = timeToMinutes(newEnd);
  const scheduleEndMin = timeToMinutes(scheduleEndTime);

  for (const booking of existingBookings) {
    if (normalizeDate(booking.eventDate) !== normalizeDate(selectedDate)) continue;
    const existingStart = timeToMinutes(booking.eventTime);
    const existingDuration = booking.appointmentDurationMinutes || 60;
    const existingAppEnd = existingStart + existingDuration;
    const existingBuffer = existingAppEnd >= scheduleEndMin ? 0 : 60;
    const existingBlockedEnd = existingAppEnd + existingBuffer;
    // Overlap: new start < existing blocked end AND new blocked end > existing start
    if (newStartMin < existingBlockedEnd && newEndMin > existingStart) {
      return true;
    }
  }
  return false;
};

// ─── Email helpers ─────────────────────────────────────────────────────────

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

const formatTimeDisplay = (time) => {
  if (!time) return "";
  const [hour, minute] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const sectionHtml = (title, rows) => {
  const content = rows
    .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "")
    .map(([label, value]) => `<tr><td style="padding:4px 16px 4px 0;color:#6b7280;white-space:nowrap;vertical-align:top;font-size:14px;">${escapeHtml(label)}:</td><td style="padding:4px 0;color:#111827;font-size:14px;">${escapeHtml(String(value))}</td></tr>`)
    .join("");
  if (!content) return "";
  return `
    <div style="margin-bottom:20px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#4b5563;">${escapeHtml(title)}</p>
      <table style="border-collapse:collapse;width:100%;">${content}</table>
    </div>`;
};

const sectionText = (title, rows) => {
  const content = rows
    .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "")
    .map(([label, value]) => `  ${label}: ${String(value).trim()}`)
    .join("\n");
  if (!content) return "";
  return `${title}\n${"─".repeat(title.length)}\n${content}\n`;
};

const buildAdminEmailHtml = (booking, sanityId) => {
  const header = `
    <div style="background:#1a3a1a;padding:24px;text-align:center;border-radius:8px 8px 0 0;">
      <h1 style="margin:0;color:#f5c842;font-size:22px;font-family:Georgia,serif;letter-spacing:0.04em;">North Star Santa</h1>
      <p style="margin:8px 0 0;color:#d1fae5;font-size:13px;">New Booking Request</p>
    </div>`;
  const body = `
    <div style="padding:28px 24px;background:#ffffff;">
      ${sectionHtml("Customer Information", [
        ["Name", booking.fullName],
        ["Company", booking.companyName],
        ["Email", booking.email],
        ["Phone", booking.phone],
      ])}
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
      ${sectionHtml("Event Information", [
        ["Event Type", booking.eventType],
        ["Date", formatDateDisplay(booking.eventDate)],
        ["Start Time", formatTimeDisplay(booking.eventTime)],
        ["Duration", booking.appointmentDurationMinutes ? `${booking.appointmentDurationMinutes} minutes` : ""],
        ["End Time", booking.appointmentEndTime ? formatTimeDisplay(booking.appointmentEndTime) : ""],
        ["Travel Buffer", booking.travelBufferMinutes != null ? `${booking.travelBufferMinutes} minutes` : ""],
        ["Blocked Until", booking.blockedEndTime ? formatTimeDisplay(booking.blockedEndTime) : ""],
        ["Children", booking.numberOfGuests != null ? String(booking.numberOfGuests) : ""],
        ["Guest Count", ""],
      ])}
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
      ${sectionHtml("Location", [
        ["Address", booking.eventLocation],
      ])}
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
      ${sectionHtml("Notes", [
        ["Message", booking.message],
      ])}
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
      ${sectionHtml("Internal", [
        ["Sanity ID", sanityId],
        ["Submitted", new Date().toLocaleString("en-US")],
      ])}
    </div>
    <div style="background:#f9fafb;padding:12px 24px;border-radius:0 0 8px 8px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">North Star Santa · santa@northstarsanta.com</p>
    </div>`;
  return `<!DOCTYPE html><html><body style="margin:0;padding:20px;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;"><div style="max-width:600px;margin:0 auto;border-radius:8px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);">${header}${body}</div></body></html>`;
};

const buildAdminEmailText = (booking, sanityId) => {
  return [
    "─".repeat(42),
    "NEW BOOKING REQUEST",
    "─".repeat(42),
    "",
    sectionText("Customer Information", [
      ["Name", booking.fullName],
      ["Company", booking.companyName],
      ["Email", booking.email],
      ["Phone", booking.phone],
    ]),
    sectionText("Event Information", [
      ["Event Type", booking.eventType],
      ["Date", formatDateDisplay(booking.eventDate)],
      ["Start Time", formatTimeDisplay(booking.eventTime)],
      ["Duration", booking.appointmentDurationMinutes ? `${booking.appointmentDurationMinutes} minutes` : ""],
      ["End Time", booking.appointmentEndTime ? formatTimeDisplay(booking.appointmentEndTime) : ""],
      ["Travel Buffer", booking.travelBufferMinutes != null ? `${booking.travelBufferMinutes} minutes` : ""],
      ["Blocked Until", booking.blockedEndTime ? formatTimeDisplay(booking.blockedEndTime) : ""],
      ["Children", booking.numberOfGuests != null ? String(booking.numberOfGuests) : ""],
    ]),
    sectionText("Location", [
      ["Address", booking.eventLocation],
    ]),
    sectionText("Notes", [
      ["Message", booking.message],
    ]),
    sectionText("Internal", [
      ["Sanity ID", sanityId],
    ]),
    "─".repeat(42),
  ].join("\n");
};

const buildCustomerConfirmationHtml = (booking) => {
  const header = `
    <div style="background:#1a3a1a;padding:24px;text-align:center;border-radius:8px 8px 0 0;">
      <h1 style="margin:0;color:#f5c842;font-size:22px;font-family:Georgia,serif;letter-spacing:0.04em;">North Star Santa</h1>
    </div>`;
  const body = `
    <div style="padding:32px 24px;background:#ffffff;">
      <p style="font-size:16px;color:#111827;margin:0 0 16px;">Dear ${escapeHtml(booking.fullName || "Friend")},</p>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">
        Thank you for reaching out to <strong>North Star Santa</strong>.
      </p>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">
        We have received your booking request and will review the details shortly.
      </p>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 24px;">
        We look forward to helping make your Christmas season magical and unforgettable. A member of our team will contact you soon.
      </p>
      ${booking.eventDate ? `
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#4b5563;">Your Request Summary</p>
        <table style="border-collapse:collapse;width:100%;">
          <tr><td style="padding:4px 16px 4px 0;color:#6b7280;font-size:14px;">Date:</td><td style="padding:4px 0;color:#111827;font-size:14px;">${escapeHtml(formatDateDisplay(booking.eventDate))}</td></tr>
          <tr><td style="padding:4px 16px 4px 0;color:#6b7280;font-size:14px;">Time:</td><td style="padding:4px 0;color:#111827;font-size:14px;">${escapeHtml(formatTimeDisplay(booking.eventTime))} EST</td></tr>
          ${booking.eventType ? `<tr><td style="padding:4px 16px 4px 0;color:#6b7280;font-size:14px;">Event Type:</td><td style="padding:4px 0;color:#111827;font-size:14px;">${escapeHtml(booking.eventType)}</td></tr>` : ""}
        </table>
      </div>` : ""}
      <p style="font-size:15px;color:#374151;margin:0;line-height:1.7;">
        Merry Christmas,<br />
        <strong style="color:#1a3a1a;">North Star Santa</strong><br />
        <a href="mailto:santa@northstarsanta.com" style="color:#b91c1c;text-decoration:none;">santa@northstarsanta.com</a>
      </p>
    </div>
    <div style="background:#f9fafb;padding:12px 24px;border-radius:0 0 8px 8px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">North Star Santa · santa@northstarsanta.com</p>
    </div>`;
  return `<!DOCTYPE html><html><body style="margin:0;padding:20px;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;"><div style="max-width:600px;margin:0 auto;border-radius:8px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);">${header}${body}</div></body></html>`;
};

const buildCustomerConfirmationText = (booking) => {
  return [
    `Dear ${booking.fullName || "Friend"},`,
    "",
    "Thank you for reaching out to North Star Santa.",
    "",
    "We have received your booking request and will review the details shortly.",
    "",
    "We look forward to helping make your Christmas season magical and unforgettable.",
    "A member of our team will contact you soon.",
    "",
    booking.eventDate ? `Your Request Summary:\n  Date: ${formatDateDisplay(booking.eventDate)}\n  Time: ${formatTimeDisplay(booking.eventTime)} EST${booking.eventType ? `\n  Event: ${booking.eventType}` : ""}` : "",
    "",
    "Merry Christmas,",
    "North Star Santa",
    "santa@northstarsanta.com",
  ].filter((l) => l !== undefined).join("\n");
};

// ─── Email send ────────────────────────────────────────────────────────────

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

const sendBookingEmails = async ({ booking, sanityId }) => {
  const messages = [];
  const admin = adminEmail();

  if (admin) {
    messages.push(
      sendResendEmail({
        to: admin,
        subject: `New Booking Request - ${booking.fullName}`,
        text: buildAdminEmailText(booking, sanityId),
        html: buildAdminEmailHtml(booking, sanityId),
      }),
    );
  }

  if (booking.email) {
    messages.push(
      sendResendEmail({
        to: booking.email,
        subject: "Thank You for Contacting North Star Santa",
        text: buildCustomerConfirmationText(booking),
        html: buildCustomerConfirmationHtml(booking),
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

// ─── Main handler ──────────────────────────────────────────────────────────

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
    const companyName = cleanText(body.companyName, 200);
    const email = cleanText(body.email, 160);
    const phone = cleanText(body.phone, 80);
    const rawEventType = cleanText(body.eventType, 120);
    const eventType = rawEventType || "Other";
    const eventDate = cleanText(body.eventDate, 20);
    const eventTime = cleanText(body.eventTime, 20);
    const eventLocation = cleanText(body.eventLocation, 1000);
    const message = cleanText(body.message, 2000);
    const numberOfGuests = body.numberOfGuests != null ? Number(body.numberOfGuests) : undefined;
    const appointmentDurationMinutes = Math.max(15, Math.min(480, Number(body.appointmentDuration) || 60));
    const scheduleEndTime = cleanText(body.scheduleEndTime, 10) || "20:00";

    if (!fullName || !email) {
      return res.status(400).json({ success: false, error: "Full name and email are required." });
    }

    // Validate appointment fits within schedule
    if (eventDate && eventTime && scheduleEndTime) {
      const startMin = timeToMinutes(eventTime);
      const endMin = startMin + appointmentDurationMinutes;
      const scheduleEnd = timeToMinutes(scheduleEndTime);
      if (endMin > scheduleEnd) {
        return res.status(400).json({
          success: false,
          error: `Appointment would end at ${minutesToTime(endMin)}, past the schedule end of ${scheduleEndTime}. Please choose an earlier start time.`,
        });
      }
    }

    // Validate against blockout dates
    if (eventDate) {
      const blockouts = await client.fetch(
        `*[_type == "blockoutDate" && active != false]{ isFullDay, startDate, endDate, startTime, endTime, repeatYearly }`,
      );
      if (isDateBlocked(eventDate, blockouts)) {
        return res.status(400).json({ success: false, error: "Santa is unavailable on this date. Please choose another date." });
      }
      if (eventTime && isTimeBlocked(eventDate, eventTime, blockouts)) {
        return res.status(400).json({ success: false, error: "That time is unavailable. Please choose another time." });
      }
    }

    // Validate against existing bookings (travel buffer overlap check)
    if (eventDate && eventTime) {
      const existingBookings = await client.fetch(
        `*[_type == "bookingRequest" && eventDate == $date && status in ["New", "Contacted", "Booked", "Confirmed"]]{
          eventDate, eventTime, appointmentDurationMinutes
        }`,
        { date: eventDate },
      );

      const bufferInfo = computeTravelBuffer(eventTime, appointmentDurationMinutes, scheduleEndTime);
      if (hasOverlapWithExistingBookings(bufferInfo.blockedStartTime, bufferInfo.blockedEndTime, existingBookings, eventDate, scheduleEndTime)) {
        return res.status(400).json({
          success: false,
          error: "That time slot overlaps with an existing booking or travel buffer. Please choose another time.",
        });
      }
    }

    // Compute travel buffer fields
    const travelBufferFields = eventTime
      ? computeTravelBuffer(eventTime, appointmentDurationMinutes, scheduleEndTime)
      : {};

    const booking = {
      fullName,
      companyName: companyName || undefined,
      email,
      phone: phone || "",
      eventType,
      eventDate: eventDate || null,
      eventTime: eventTime || "",
      appointmentDurationMinutes,
      ...travelBufferFields,
      eventLocation: eventLocation || "",
      numberOfGuests: Number.isFinite(numberOfGuests) && numberOfGuests >= 0 ? numberOfGuests : undefined,
      message: message || "",
      status: "New",
      submittedAt: new Date().toISOString(),
    };

    const created = await client.create({ _type: "bookingRequest", ...booking });

    await sendBookingEmails({ booking: { ...booking }, sanityId: created._id });

    return res.status(200).json({ success: true, id: created._id });
  } catch (error) {
    console.error("Sanity create error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ success: false, error: "Could not send booking request.", detail: msg });
  }
}
