import type { VercelRequest, VercelResponse } from "@vercel/node";
import { cleanText, readJsonBody, sanityWriteClient } from "./_sanity.js";

interface BookingPayload {
  fullName?: string;
  email?: string;
  phone?: string;
  eventType?: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  numberOfGuests?: number;
  message?: string;
}

const eventTypeMap: Record<string, string> = {
  "Private Home Visit": "Home Visit",
  "Hospital Visit": "Hospital Event",
  "Community Event / Parade": "Community Event",
  "HOA / Neighborhood Event": "Community Event",
  "Breakfast / Lunch / Dinner with Santa": "Other",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = await readJsonBody<BookingPayload>(req);
    const fullName = cleanText(body.fullName, 160);
    const email = cleanText(body.email, 160);
    const phone = cleanText(body.phone, 80);
    const rawEventType = cleanText(body.eventType, 120);
    const eventType = eventTypeMap[rawEventType] || rawEventType;
    const eventDate = cleanText(body.eventDate, 20);
    const eventTime = cleanText(body.eventTime, 20);
    const eventLocation = cleanText(body.eventLocation, 1000);
    const message = cleanText(body.message, 2000);
    const numberOfGuests = Number(body.numberOfGuests || 0);

    if (!fullName || !email || !phone || !eventType || !eventDate || !eventTime || !eventLocation) {
      return res.status(400).json({ error: "Please complete the required booking fields." });
    }

    const doc = await sanityWriteClient().create({
      _type: "bookingRequest",
      fullName,
      email,
      phone,
      eventType,
      eventDate,
      eventTime,
      eventLocation,
      numberOfGuests: Number.isFinite(numberOfGuests) ? numberOfGuests : undefined,
      message: message || undefined,
      status: "New",
      submittedAt: new Date().toISOString(),
    });

    return res.status(200).json({ id: doc._id });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Could not send booking request.",
    });
  }
}
