import { defineField, defineType } from "sanity";

export default defineType({
  name: "galleryPhoto",
  title: "Gallery Photo",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string" }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "caption", title: "Caption", type: "text" }),
    defineField({ name: "submittedBy", title: "Submitted By", type: "string" }),
    defineField({ name: "submittedEmail", title: "Submitted Email", type: "string" }),
    defineField({ name: "approved", title: "Approved", type: "boolean", initialValue: false }),
    defineField({ name: "featured", title: "Featured", type: "boolean", initialValue: false }),
    defineField({ name: "submittedAt", title: "Submitted At", type: "datetime", initialValue: () => new Date().toISOString() }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "submittedBy",
      media: "image",
      approved: "approved",
    },
    prepare({ title, subtitle, media, approved }) {
      return {
        title: title || "Gallery photo",
        subtitle: `${approved ? "Approved" : "Needs approval"}${subtitle ? ` - ${subtitle}` : ""}`,
        media,
      };
    },
  },
});
