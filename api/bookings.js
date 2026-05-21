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

export default async function handler(req, res) {
  console.log("API hit: bookings");
  console.log("Sanity project:", projectId);
  console.log("Token exists:", Boolean(process.env.SANITY_WRITE_TOKEN));

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
      console.log("[booking] active blockout dates fetched:", blockouts.length);

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

    console.log("Creating bookingRequest for:", fullName, email, eventDate);

    const created = await client.create({
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
    });

    console.log("bookingRequest created:", created._id);
    return res.status(200).json({ success: true, id: created._id });
  } catch (error) {
    console.error("Sanity create error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ success: false, error: "Could not send booking request.", detail: msg });
  }
}
