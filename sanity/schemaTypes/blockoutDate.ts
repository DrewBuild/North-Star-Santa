import { defineField, defineType } from "sanity";

const timePattern = /^(([01]?\d|2[0-3]):[0-5]\d|([1-9]|1[0-2]):[0-5]\d\s?(AM|PM|am|pm))$/;

const formatTime = (time?: string) => {
  if (!time) return "";
  const value = time.trim();
  const match12 = value.match(/^([1-9]|1[0-2]):([0-5]\d)\s?(AM|PM)$/i);
  if (match12) return `${match12[1]}:${match12[2]} ${match12[3].toUpperCase()}`;
  const [hour, minute] = value.slice(0, 5).split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return value;
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${suffix}`;
};

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
      title: "Blocked From",
      type: "string",
      description: "Use regular time, e.g. 2:00 PM. Existing 24-hour values such as 14:00 are also accepted.",
      hidden: ({ document }) => document?.isFullDay !== false,
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (context.document?.isFullDay !== false) return true;
          if (!value) return "Start time is required for partial-day blockouts.";
          return timePattern.test(value.trim()) || "Use regular time, e.g. 2:00 PM.";
        }),
    }),
    defineField({
      name: "endTime",
      title: "Blocked Until",
      type: "string",
      description: "Use regular time, e.g. 4:00 PM. Existing 24-hour values such as 16:00 are also accepted.",
      hidden: ({ document }) => document?.isFullDay !== false,
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (context.document?.isFullDay !== false) return true;
          if (!value) return "End time is required for partial-day blockouts.";
          return timePattern.test(value.trim()) || "Use regular time, e.g. 4:00 PM.";
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
      isFullDay: "isFullDay",
      startTime: "startTime",
      endTime: "endTime",
    },
    prepare({ title, startDate, endDate, active, repeatYearly, isFullDay, startTime, endTime }) {
      const range = endDate && endDate !== startDate ? `${startDate} – ${endDate}` : startDate;
      const timeRange = isFullDay === false ? `, ${formatTime(startTime)} - ${formatTime(endTime)}` : "";
      const flags = [repeatYearly && "repeats yearly", !active && "inactive"].filter(Boolean).join(", ");
      return {
        title: title ?? "Untitled Blockout",
        subtitle: flags ? `${range}${timeRange} (${flags})` : `${range}${timeRange}`,
      };
    },
  },
});
