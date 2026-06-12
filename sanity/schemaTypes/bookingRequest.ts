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

const statusOptions = ["New", "Contacted", "Confirmed", "Completed", "Cancelled", "Booked", "Declined"];

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
      name: "companyName",
      title: "Company Name",
      type: "string",
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
      title: "Event Start Time",
      type: "string",
    }),
    defineField({
      name: "appointmentDurationMinutes",
      title: "Appointment Duration (minutes)",
      type: "number",
      initialValue: 60,
    }),
    defineField({
      name: "appointmentEndTime",
      title: "Appointment End Time",
      type: "string",
    }),
    defineField({
      name: "travelBufferMinutes",
      title: "Travel Buffer (minutes)",
      type: "number",
    }),
    defineField({
      name: "blockedStartTime",
      title: "Blocked Window Start",
      type: "string",
    }),
    defineField({
      name: "blockedEndTime",
      title: "Blocked Window End",
      type: "string",
    }),
    defineField({
      name: "scheduleEndTime",
      title: "Schedule End Time",
      type: "string",
    }),
    defineField({
      name: "isEndOfDayBooking",
      title: "Is End-of-Day Booking",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "eventLocation",
      title: "Event Location",
      type: "string",
    }),
    defineField({
      name: "numberOfGuests",
      title: "Number of Guests / Children",
      type: "number",
    }),
    defineField({
      name: "message",
      title: "Message / Notes",
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
        layout: "radio",
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
      subtitle: "eventDate",
      description: "status",
    },
    prepare({ title, subtitle, description }) {
      return {
        title: title || "Unknown",
        subtitle: [subtitle, description].filter(Boolean).join(" · "),
      };
    },
  },
  orderings: [
    {
      title: "Submitted (newest first)",
      name: "submittedAtDesc",
      by: [{ field: "submittedAt", direction: "desc" }],
    },
    {
      title: "Event Date (soonest first)",
      name: "eventDateAsc",
      by: [{ field: "eventDate", direction: "asc" }],
    },
  ],
});
