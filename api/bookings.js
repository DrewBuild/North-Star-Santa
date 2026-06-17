import { createClient } from "@sanity/client";
import {
  DEFAULT_APPOINTMENT_DURATION_MINUTES,
  computeTravelBuffer,
  formatTime12Hour,
  getBlockedWindow,
  hasBlockedWindowOverlap,
  timeToMinutes,
} from "./shared/bookingAvailability.js";
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

const normalizeTimeTo24Hour = (time) => {
  if (!time) return "";
  const value = time.trim();
  const match12 = value.match(/^([1-9]|1[0-2]):([0-5]\d)\s?(AM|PM)$/i);
  if (match12) {
    const [, hourValue, minute, meridiem] = match12;
    let hour = Number(hourValue);
    if (meridiem.toUpperCase() === "PM" && hour !== 12) hour += 12;
    if (meridiem.toUpperCase() === "AM" && hour === 12) hour = 0;
    return `${String(hour).padStart(2, "0")}:${minute}`;
  }
  return value.slice(0, 5);
};

const isTimeBlocked = (selectedDate, selectedTime, blockouts) => {
  const normalizedTime = normalizeTimeTo24Hour(selectedTime);
  if (!selectedDate || !normalizedTime) return false;

  return blockouts.some((blockout) => {
    if (blockout.isFullDay !== false || !isDateInBlockout(selectedDate, blockout)) return false;

    const startTime = normalizeTimeTo24Hour(blockout.startTime);
    const endTime = normalizeTimeTo24Hour(blockout.endTime);

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

const sendBookingEmails = async ({ client, booking, sanityId }) => {
  const details = [
    ["Name", booking.fullName],
    ["Email", booking.email],
    ["Phone", booking.phone],
    ["Preferred Contact Method", booking.preferredContactMethod],
    ["Company Name", booking.companyName],
    ["Address", booking.streetAddress],
    ["City", booking.city],
    ["State", booking.state],
    ["ZIP Code", booking.zipCode],
    ["Event Type", booking.eventType],
    ["Number of Children", booking.numberOfGuests],
    ["Requested Date", booking.eventDate],
    ["Requested Time", formatTime12Hour(booking.eventTime)],
    ["Appointment Duration", `${booking.appointmentDurationMinutes} minutes`],
    ["Appointment End Time", formatTime12Hour(booking.appointmentEndTime)],
    ["Travel Buffer", `${booking.travelBufferMinutes} minutes`],
    ["Blocked Start Time", formatTime12Hour(booking.blockedStartTime)],
    ["Blocked End Time", formatTime12Hour(booking.blockedEndTime)],
    ["Schedule End Time", formatTime12Hour(booking.scheduleEndTime)],
    ["End-of-Day Booking", booking.isEndOfDayBooking ? "Yes" : "No"],
    ["Message", booking.message],
    ["Sanity document ID", sanityId],
  ];
  const textSummary = formatDetailRowsText(details);
  const htmlSummary = formatDetailRowsHtml(details);
  const admin = await getNotificationEmail(client);
  const messages = [];

  messages.push(
    sendResendEmail({
      to: admin,
      subject: "New North Star Santa Booking Request",
      text: `New Booking Request\n\n${textSummary}`,
      html: wrapEmailHtml("New Booking Request", htmlSummary),
    }),
  );

  if (booking.email) {
    messages.push(
      sendResendEmail({
        to: booking.email,
        subject: "North Star Santa received your booking request",
        text: `Thank you for your North Star Santa booking request. Santa will follow up soon.\n\n${textSummary}`,
        html: wrapEmailHtml("Booking Request Received", htmlSummary),
      }),
    );
  }

  const results = await Promise.allSettled(messages);
  const failed = results.find((result) => result.status === "rejected");
  if (failed) throw failed.reason;
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
    const companyName = cleanText(body.companyName, 200);
    const email = cleanText(body.email, 160);
    const phone = cleanText(body.phone, 80);
    const preferredContactMethod = cleanText(body.preferredContactMethod, 80);
    const rawEventType = cleanText(body.eventType, 120);
    const eventType = eventTypeMap[rawEventType] || rawEventType || "Other";
    const eventDate = cleanText(body.eventDate, 20);
    const eventTime = cleanText(body.eventTime, 20);
    const streetAddress = cleanText(body.streetAddress, 240);
    const apartment = cleanText(body.apartment, 120);
    const city = cleanText(body.city, 120);
    const state = cleanText(body.state, 40);
    const zipCode = cleanText(body.zipCode, 20);
    const eventLocation = cleanText(body.eventLocation, 1000);
    const message = cleanText(body.message, 2000);
    const numberOfGuests = body.numberOfGuests !== undefined && body.numberOfGuests !== "" ? Number(body.numberOfGuests) : undefined;
    const appointmentDurationMinutes = Math.max(
      15,
      Math.min(480, Number(body.appointmentDuration) || DEFAULT_APPOINTMENT_DURATION_MINUTES),
    );
    const scheduleEndTime = cleanText(body.scheduleEndTime, 10) || "20:00";

    if (!fullName || !email) {
      return res.status(400).json({ success: false, error: "Full name and email are required." });
    }

    if (eventTime && scheduleEndTime) {
      const appointmentEndMinutes = timeToMinutes(eventTime) + appointmentDurationMinutes;
      const scheduleEndMinutes = timeToMinutes(scheduleEndTime);
      if (appointmentEndMinutes > scheduleEndMinutes) {
        return res.status(400).json({
          success: false,
          error: `Appointment would end at ${formatTime12Hour(`${Math.floor(appointmentEndMinutes / 60).toString().padStart(2, "0")}:${(appointmentEndMinutes % 60).toString().padStart(2, "0")}`)}, past the schedule end of ${formatTime12Hour(scheduleEndTime)}.`,
        });
      }
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

    const bufferInfo = eventTime
      ? computeTravelBuffer(eventTime, appointmentDurationMinutes, scheduleEndTime)
      : {
          appointment_end_time: "",
          travel_buffer_minutes: 0,
          blocked_start_time: "",
          blocked_end_time: "",
          schedule_end_time: scheduleEndTime,
          is_end_of_day_booking: false,
        };

    if (eventDate && eventTime) {
      const existingBookings = await client.fetch(
        `*[_type == "bookingRequest" && eventDate == $date && status in ["New", "Contacted", "Booked", "Confirmed"]]{
          eventTime,
          appointmentDurationMinutes,
          blockedStartTime,
          blockedEndTime,
          scheduleEndTime
        }`,
        { date: eventDate },
      );
      const blockedWindows = existingBookings
        .map((booking) => getBlockedWindow(booking, scheduleEndTime))
        .filter(Boolean);

      if (
        hasBlockedWindowOverlap(
          timeToMinutes(bufferInfo.blocked_start_time),
          timeToMinutes(bufferInfo.blocked_end_time),
          blockedWindows,
        )
      ) {
        return res.status(400).json({
          success: false,
          error: "That time slot overlaps with an existing booking or travel buffer. Please choose another time.",
        });
      }
    }

    const booking = {
      _type: "bookingRequest",
      fullName,
      companyName: companyName || undefined,
      email,
      phone: phone || "",
      preferredContactMethod: preferredContactMethod || undefined,
      eventType,
      eventDate: eventDate || null,
      eventTime: eventTime || "",
      eventTimeDisplay: formatTime12Hour(eventTime),
      appointmentDurationMinutes,
      appointmentEndTime: bufferInfo.appointment_end_time,
      appointmentEndTimeDisplay: formatTime12Hour(bufferInfo.appointment_end_time),
      travelBufferMinutes: bufferInfo.travel_buffer_minutes,
      blockedStartTime: bufferInfo.blocked_start_time,
      blockedEndTime: bufferInfo.blocked_end_time,
      blockedWindowDisplay: `${formatTime12Hour(bufferInfo.blocked_start_time)} - ${formatTime12Hour(bufferInfo.blocked_end_time)}`,
      scheduleEndTime: bufferInfo.schedule_end_time,
      scheduleEndTimeDisplay: formatTime12Hour(bufferInfo.schedule_end_time),
      isEndOfDayBooking: bufferInfo.is_end_of_day_booking,
      eventLocation: eventLocation || "",
      streetAddress: streetAddress || undefined,
      apartment: apartment || undefined,
      city: city || undefined,
      state: state || undefined,
      zipCode: zipCode || undefined,
      numberOfGuests: Number.isFinite(numberOfGuests) && numberOfGuests > 0 ? numberOfGuests : undefined,
      message: message || "",
      status: "New",
      submittedAt: new Date().toISOString(),
    };

    const created = await client.create(booking);

    await sendBookingEmails({ client, booking, sanityId: created._id });

    return res.status(200).json({ success: true, id: created._id });
  } catch (error) {
    console.error("Booking handler error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    const emailFailed = /email|resend/i.test(msg);
    return res.status(500).json({
      success: false,
      error: emailFailed
        ? `Could not send notification email to ${DEFAULT_CONTACT_EMAIL}. Please try again or email Santa directly.`
        : "Could not send booking request.",
      detail: msg,
    });
  }
}
