import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@sanity/client";

// --- blockout helpers (mirrors src/lib/sanity.ts, kept self-contained) ---

function normalizeDate(dateValue: string | null | undefined): string {
  if (!dateValue) return "";
  return dateValue.slice(0, 10);
}

function getMonthDay(dateString: string): string {
  const normalized = normalizeDate(dateString);
  return normalized ? normalized.slice(5, 10) : "";
}

type BlockoutRecord = {
  startDate: string;
  endDate: string | null;
  repeatYearly: boolean;
};

function isDateBlockedApi(selectedDate: string, blockouts: BlockoutRecord[]): boolean {
  const selected = normalizeDate(selectedDate);
  if (!selected || blockouts.length === 0) return false;
  const selectedMD = getMonthDay(selected);
  return blockouts.some((b) => {
    const start = normalizeDate(b.startDate);
    const end = normalizeDate(b.endDate || b.startDate);
    if (!start) return false;
    if (b.repeatYearly) {
      const startMD = getMonthDay(start);
      const endMD = getMonthDay(end);
      if (!endMD || startMD === endMD) return selectedMD === startMD;
      return selectedMD >= startMD && selectedMD <= endMD;
    }
    return selected >= start && selected <= end;
  });
}

const clean = (value: unknown, max = 500) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const eventTypeMap: Record<string, string> = {
  "Private Home Visit": "Home Visit",
  "Hospital Visit": "Hospital Event",
  "Community Event / Parade": "Community Event",
  "HOA / Neighborhood Event": "Community Event",
  "Breakfast / Lunch / Dinner with Santa": "Other",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("API hit: bookings");
  console.log("Sanity project:", process.env.VITE_SANITY_PROJECT_ID || "wme1a7n3 (fallback)");
  console.log("Token exists:", Boolean(process.env.SANITY_WRITE_TOKEN));

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  if (!process.env.SANITY_WRITE_TOKEN) {
    console.error("SANITY_WRITE_TOKEN is not set — writes will fail");
    return res.status(500).json({ success: false, error: "Server configuration error. Please contact the site owner." });
  }

  const client = createClient({
    projectId: process.env.VITE_SANITY_PROJECT_ID || "wme1a7n3",
    dataset: process.env.VITE_SANITY_DATASET || "production",
    apiVersion: process.env.VITE_SANITY_API_VERSION || "2025-01-01",
    token: process.env.SANITY_WRITE_TOKEN,
    useCdn: false,
  });

  try {
    const body = req.body ?? {};
    const fullName = clean(body.fullName, 160);
    const email = clean(body.email, 160);
    const phone = clean(body.phone, 80);
    const rawEventType = clean(body.eventType, 120);
    const eventType = eventTypeMap[rawEventType] || rawEventType || "Other";
    const eventDate = clean(body.eventDate, 20);
    const eventTime = clean(body.eventTime, 20);
    const eventLocation = clean(body.eventLocation, 1000);
    const message = clean(body.message, 2000);
    const numberOfGuests = Number(body.numberOfGuests || 0);

    if (!fullName || !email) {
      return res.status(400).json({ success: false, error: "Full name and email are required." });
    }

    if (eventDate) {
      const blockouts = await client.fetch<BlockoutRecord[]>(
        `*[_type == "blockoutDate" && active != false]{ startDate, endDate, repeatYearly }`,
      );
      if (isDateBlockedApi(eventDate, blockouts)) {
        return res.status(400).json({
          success: false,
          error: "Santa is unavailable on this date. Please choose another date.",
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
