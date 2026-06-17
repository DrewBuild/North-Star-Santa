import { defineField, defineType } from "sanity";

export default defineType({
  name: "galleryPhoto",
  title: "Gallery Photo",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: "caption",
      title: "Caption",
      type: "text",
    }),
    defineField({
      name: "submittedBy",
      title: "Submitted By",
      type: "string",
    }),
    defineField({
      name: "submittedEmail",
      title: "Submitted Email",
      type: "string",
    }),
    defineField({
      name: "approved",
      title: "Approved",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "submittedAt",
      title: "Submitted At",
      type: "datetime",
    }),
  ],
  preview: {
    select: {
      title: "title",
      submittedBy: "submittedBy",
      submittedAt: "submittedAt",
      media: "image",
    },
    prepare({ title, submittedBy, submittedAt, media }) {
      const date = submittedAt ? new Date(submittedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "";
      return {
        title: title || "Submitted photo",
        subtitle: [submittedBy, date].filter(Boolean).join(" | "),
        media,
      };
    },
  },
});
