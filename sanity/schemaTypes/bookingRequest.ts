import { defineField, defineType } from "sanity";

const eventTypeOptions = [
  "Home Visit",
  "Corporate Party",
  "School Event",
  "Hospital Event",
  "Community Event",
  "Breakfast with Santa",
  "Lunch with Santa",
  "Dinner with Santa",
  "Other",
];

const statusOptions = ["New", "Contacted", "Booked", "Confirmed", "Declined"];

const formatTime = (time?: string) => {
  if (!time) return "";
  const [hour, minute] = time.slice(0, 5).split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return time;
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
};

export default defineType({
  name: "bookingRequest",
  title: "Booking Request",
  type: "document",
  fields: [
    defineField({
      name: "fullName",
      title: "Full Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "email",
      title: "Email",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "phone",
      title: "Phone",
      type: "string",
    }),
    defineField({
      name: "preferredContactMethod",
      title: "Preferred Contact Method",
      type: "string",
    }),
    defineField({
      name: "companyName",
      title: "Company Name",
      type: "string",
    }),
    defineField({
      name: "eventType",
      title: "Event Type",
      type: "string",
      options: {
        list: eventTypeOptions.map((eventType) => ({
          title: eventType,
          value: eventType,
        })),
      },
    }),
    defineField({
      name: "eventDate",
      title: "Event Date",
      type: "date",
    }),
    defineField({
      name: "eventTime",
      title: "Event Time (system value)",
      type: "string",
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: "eventTimeDisplay",
      title: "Event Time",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "eventLocation",
      title: "Event Location",
      type: "string",
    }),
    defineField({
      name: "streetAddress",
      title: "Street Address",
      type: "string",
    }),
    defineField({
      name: "apartment",
      title: "Apartment / Suite",
      type: "string",
    }),
    defineField({
      name: "city",
      title: "City",
      type: "string",
    }),
    defineField({
      name: "state",
      title: "State",
      type: "string",
    }),
    defineField({
      name: "zipCode",
      title: "ZIP Code",
      type: "string",
    }),
    defineField({
      name: "numberOfGuests",
      title: "Number of Children",
      type: "number",
    }),
    defineField({
      name: "appointmentDurationMinutes",
      title: "Appointment Duration (minutes)",
      type: "number",
      readOnly: true,
    }),
    defineField({
      name: "appointmentEndTime",
      title: "Appointment End Time (system value)",
      type: "string",
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: "appointmentEndTimeDisplay",
      title: "Appointment End Time",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "travelBufferMinutes",
      title: "Travel Buffer (minutes)",
      type: "number",
      readOnly: true,
    }),
    defineField({
      name: "blockedStartTime",
      title: "Blocked Start Time (system value)",
      type: "string",
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: "blockedEndTime",
      title: "Blocked End Time (system value)",
      type: "string",
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: "blockedWindowDisplay",
      title: "Blocked Window",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "scheduleEndTime",
      title: "Schedule End Time (system value)",
      type: "string",
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: "scheduleEndTimeDisplay",
      title: "Schedule End Time",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "isEndOfDayBooking",
      title: "End-of-Day Booking",
      type: "boolean",
      readOnly: true,
    }),
    defineField({
      name: "message",
      title: "Message",
      type: "text",
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: statusOptions.map((status) => ({
          title: status,
          value: status,
        })),
      },
      initialValue: "New",
    }),
    defineField({
      name: "submittedAt",
      title: "Submitted At",
      type: "datetime",
    }),
  ],
  preview: {
    select: {
      title: "fullName",
      eventDate: "eventDate",
      eventTime: "eventTime",
      eventType: "eventType",
      status: "status",
    },
    prepare({ title, eventDate, eventTime, eventType, status }) {
      return {
        title: title || "Booking Request",
        subtitle: [eventType, eventDate, formatTime(eventTime), status].filter(Boolean).join(" | "),
      };
    },
  },
});
