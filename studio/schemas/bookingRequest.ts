import { defineField, defineType } from "sanity";

const statuses = ["New", "Contacted", "Booked", "Declined"];

export default defineType({
  name: "bookingRequest",
  title: "Booking Request",
  type: "document",
  fields: [
    defineField({ name: "fullName", title: "Full Name", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "email", title: "Email", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "phone", title: "Phone", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "eventType", title: "Event Type", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "eventDate", title: "Event Date", type: "date", validation: (Rule) => Rule.required() }),
    defineField({ name: "eventTime", title: "Event Time", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "eventLocation", title: "Event Location", type: "text", validation: (Rule) => Rule.required() }),
    defineField({ name: "numberOfGuests", title: "Number of Guests", type: "number" }),
    defineField({ name: "message", title: "Message", type: "text" }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: statuses.map((status) => ({ title: status, value: status })),
        layout: "radio",
      },
      initialValue: "New",
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "submittedAt", title: "Submitted At", type: "datetime", initialValue: () => new Date().toISOString() }),
  ],
  preview: {
    select: {
      title: "fullName",
      date: "eventDate",
      status: "status",
    },
    prepare({ title, date, status }) {
      return {
        title,
        subtitle: `${status || "New"}${date ? ` - ${date}` : ""}`,
      };
    },
  },
});
