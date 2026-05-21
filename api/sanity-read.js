import { createClient } from "@sanity/client";

const projectId = process.env.VITE_SANITY_PROJECT_ID || "wme1a7n3";
const dataset = process.env.VITE_SANITY_DATASET || "production";
const apiVersion = process.env.VITE_SANITY_API_VERSION || "2025-01-01";

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
});

const queries = {
  approvedTestimonials: () => `
    *[_type == "testimonial" && approved == true && !(_id in path("drafts.**"))]
      | order(featured desc, submittedAt desc)[0...24]{
        "id": _id,
        "_id": _id,
        "_type": _type,
        name,
        reviewText,
        organization,
        location,
        approved,
        featured,
        submittedAt
      }
  `,
  approvedGalleryPhotos: ({ limit = 24 } = {}) => `
    *[_type == "galleryPhoto" && approved == true && defined(image.asset) && !(_id in path("drafts.**"))]
      | order(featured desc, submittedAt desc)[0...${limit}]{
        "id": _id,
        "_id": _id,
        "_type": _type,
        title,
        "imageUrl": image.asset->url,
        caption,
        submittedBy,
        approved,
        featured,
        submittedAt
      }
  `,
  featuredTestimonials: () => `
    *[_type == "testimonial" && approved == true && featured == true && !(_id in path("drafts.**"))]
      | order(submittedAt desc)[0...6]{
        "id": _id,
        name,
        reviewText,
        organization,
        location,
        featured,
        submittedAt
      }
  `,
  siteSettings: () => `
    *[_type == "siteSettings" && !(_id in path("drafts.**"))][0]{
      siteName,
      heroTitle,
      heroSubtitle,
      contactEmail,
      phone,
      "logoUrl": logo.asset->url
    }
  `,
  bookedSlots: () => `
    *[_type == "bookingRequest" && status in ["New", "Contacted", "Booked"]]{
      "event_date": eventDate,
      "event_time": eventTime,
      status
    }
  `,
  activeBlockouts: () => `
    *[_type == "blockoutDate" && active != false && !(_id in path("drafts.**"))]{
      "id": _id,
      title,
      startDate,
      endDate,
      isFullDay,
      startTime,
      endTime,
      reason,
      active,
      repeatYearly
    }
  `,
};

const readJsonBody = async (req) => {
  if (req.body) return typeof req.body === "string" ? JSON.parse(req.body) : req.body;

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
};

const normalizeLimit = (value) => {
  const limit = Number(value || 24);
  if (!Number.isFinite(limit)) return 24;
  return Math.max(1, Math.min(60, Math.floor(limit)));
};

const runRead = async (kind, params = {}) => {
  const queryFactory = queries[kind];
  if (!queryFactory) {
    const allowed = Object.keys(queries).join(", ");
    throw new Error(`Unsupported Sanity read kind "${kind}". Allowed: ${allowed}`);
  }

  const safeParams = { ...params, limit: normalizeLimit(params.limit) };
  const query = queryFactory(safeParams);
  console.log(`[sanity-read:${kind}] query`, query);
  const data = await client.fetch(query);
  console.log(`[sanity-read:${kind}] result count`, Array.isArray(data) ? data.length : data ? 1 : 0);
  console.log(`[sanity-read:${kind}] result data`, data);
  return { query, data };
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const body = await readJsonBody(req);
    const kind = String(body.kind || "");
    const params = body.params && typeof body.params === "object" ? body.params : {};
    const result = await runRead(kind, params);

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      success: true,
      projectId,
      dataset,
      ...result,
    });
  } catch (error) {
    console.error("Sanity read error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ success: false, error: message });
  }
}
