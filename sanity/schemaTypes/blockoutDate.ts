import { defineField, defineType } from "sanity";

export default defineType({
  name: "blockoutDate",
  title: "Blockout Date",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: "Internal label, e.g. 'Christmas Eve' or 'Family vacation'",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "startDate",
      title: "Start Date",
      type: "date",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "endDate",
      title: "End Date",
      type: "date",
      description: "Leave blank for a single-day blockout.",
    }),
    defineField({
      name: "isFullDay",
      title: "Full Day Block",
      type: "boolean",
      initialValue: true,
      description: "Block the entire day. Uncheck to specify start/end times.",
    }),
    defineField({
      name: "startTime",
      title: "Blocked From (HH:MM, 24-hour)",
      type: "string",
      description: "Only applies when Full Day Block is off.",
      hidden: ({ document }) => document?.isFullDay !== false,
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (context.document?.isFullDay !== false) return true;
          if (!value) return "Start time is required for partial-day blockouts.";
          return /^([01]\d|2[0-3]):[0-5]\d$/.test(value) || "Use 24-hour HH:mm format, e.g. 09:00.";
        }),
    }),
    defineField({
      name: "endTime",
      title: "Blocked Until (HH:MM, 24-hour)",
      type: "string",
      description: "Only applies when Full Day Block is off.",
      hidden: ({ document }) => document?.isFullDay !== false,
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (context.document?.isFullDay !== false) return true;
          if (!value) return "End time is required for partial-day blockouts.";
          return /^([01]\d|2[0-3]):[0-5]\d$/.test(value) || "Use 24-hour HH:mm format, e.g. 12:00.";
        }),
    }),
    defineField({
      name: "reason",
      title: "Reason (internal notes)",
      type: "text",
      description: "Not shown publicly. Optional note for your reference.",
    }),
    defineField({
      name: "active",
      title: "Active",
      type: "boolean",
      initialValue: true,
      description: "Uncheck to disable this blockout without deleting it.",
    }),
    defineField({
      name: "repeatYearly",
      title: "Repeat Yearly",
      type: "boolean",
      initialValue: false,
      description:
        "When on, this blockout applies on the same month/day every year (e.g., Christmas Eve on Dec 24 every year).",
    }),
  ],
  preview: {
    select: {
      title: "title",
      startDate: "startDate",
      endDate: "endDate",
      active: "active",
      repeatYearly: "repeatYearly",
    },
    prepare({ title, startDate, endDate, active, repeatYearly }) {
      const range = endDate && endDate !== startDate ? `${startDate} – ${endDate}` : startDate;
      const flags = [repeatYearly && "repeats yearly", !active && "inactive"].filter(Boolean).join(", ");
      return {
        title: title ?? "Untitled Blockout",
        subtitle: flags ? `${range} (${flags})` : range,
      };
    },
  },
});
