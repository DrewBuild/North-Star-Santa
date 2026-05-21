import { createReadStream, existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@sanity/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const loadEnvFile = async (fileName) => {
  const filePath = path.join(rootDir, fileName);
  if (!existsSync(filePath)) return;

  const contents = await readFile(filePath, "utf8");
  contents.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) return;

    const [key, ...valueParts] = trimmed.split("=");
    if (process.env[key]) return;

    const rawValue = valueParts.join("=").trim();
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
  });
};

await loadEnvFile(".env");
await loadEnvFile(".env.local");

const projectId = process.env.SANITY_PROJECT_ID || "wme1a7n3";
const dataset = process.env.SANITY_DATASET || "production";
const apiVersion = process.env.SANITY_API_VERSION || "2025-01-01";
const token = process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_WRITE_TOKEN;

if (!token) {
  throw new Error("Missing SANITY_API_WRITE_TOKEN. Set it before running npm run seed:sanity.");
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: false,
});

const seedDate = "2026-05-21T00:00:00.000Z";

const testimonials = [
  {
    _id: "starter-testimonial-erin-q",
    _type: "testimonial",
    name: "Erin Q.",
    reviewText:
      "Santa's visit to our home before Christmas was truly magical. He was kind, patient, and wonderful with the children - reading stories, singing songs, decorating cookies, and even letting them try on his coat. The experience felt personal and unforgettable, and our family will treasure the memories for years to come.",
    approved: true,
    featured: true,
    submittedAt: seedDate,
  },
  {
    _id: "starter-testimonial-tiffani-s-pik-n-pig",
    _type: "testimonial",
    name: "Tiffani S.",
    organization: "Pik-N-Pig",
    location: "Carthage, NC",
    reviewText:
      "For over 16 years, our Santa event at Pik-N-Pig has grown into one of the county's top Christmas traditions, and expectations are high. Santa Wade exceeded them all. From flying in on a small plane to immediately jumping into character and creating magic for the children, he handled every moment with warmth and professionalism. We received countless compliments about both the event and our incredible Santa. We're thrilled to have found our future Santa - as long as he'll have us.",
    approved: true,
    featured: true,
    submittedAt: seedDate,
  },
];

const galleryPhotos = [
  {
    _id: "starter-gallery-santa-wade",
    title: "Santa Wade",
    caption: "Santa Wade bringing classic Christmas warmth to every visit.",
    filePath: "src/assets/santa-wade.jpg",
    featured: true,
  },
  {
    _id: "starter-gallery-img-0960",
    title: "Christmas magic in action",
    caption: "A joyful experience that feels personal, warm, and memorable.",
    filePath: "src/assets/IMG_0960.jpeg",
    featured: true,
  },
  {
    _id: "starter-gallery-img-2658",
    title: "Professional Santa portrait",
    caption: "A polished Santa presence for private and professional events.",
    filePath: "src/assets/IMG_2658.jpeg",
    featured: true,
  },
  {
    _id: "starter-gallery-img-9520",
    title: "Santa visit moment",
    caption: "Real holiday moments with North Star Santa.",
    filePath: "src/assets/IMG_9520.jpeg",
    featured: false,
  },
  {
    _id: "starter-gallery-img-9947",
    title: "Santa event appearance",
    caption: "Festive appearances for families, schools, and community events.",
    filePath: "src/assets/IMG_9947.jpeg",
    featured: false,
  },
  {
    _id: "starter-gallery-carolina-pines",
    title: "Carolina Pines Christmas setting",
    caption: "A warm seasonal setting for Christmas memories.",
    filePath: "src/assets/carolina-pines-1.jpg",
    featured: false,
  },
];

const services = [
  {
    _id: "starter-service-home-visits",
    title: "Home Visits",
    description:
      "North Star Santa loves Home Visits! Santa is known for his personalized in-home visits, creating a truly magical experience for your children. Before arriving, he gathers special details about each child — favorite colors, teachers, pets, and more — and thoughtfully weaves those personal touches into every conversation, making each visit feel truly one-of-a-kind.",
    imageAlt: "Santa Wade creating a magical home visit experience",
    category: "Home Visits",
    order: 1,
    featured: true,
    filePath: "src/assets/IMG_0960.jpeg",
  },
  {
    _id: "starter-service-corporate-parties",
    title: "Corporate Parties",
    description:
      "North Star Santa enjoys Corporate Parties! Santa brings a touch of holiday magic to corporate events, Christmas parties, and special gatherings, delighting guests of all ages with his engaging presence and adding a festive charm to every celebration.",
    imageAlt: "North Star Santa ready for a polished corporate Christmas event",
    category: "Corporate Parties",
    order: 2,
    featured: true,
    filePath: "src/assets/IMG_9520.jpeg",
  },
  {
    _id: "starter-service-school-events",
    title: "School Events",
    description:
      "North Star Santa delights in school events, from classroom visits to larger Christmas programs. His ability to engage even the shyest child makes these visits memorable, warm, and easy for staff to host.",
    imageAlt: "North Star Santa at a cheerful school event",
    category: "School Events",
    order: 3,
    featured: true,
    filePath: "src/assets/IMG_2658.jpeg",
  },
  {
    _id: "starter-service-hospital-events",
    title: "Hospital Events",
    description:
      "Santa can bring comfort and joy to children in hospitals during the Christmas season. His cheerful presence helps brighten the spirits of young patients and their families with gentle, caring holiday magic.",
    imageAlt: "Santa Wade bringing warmth and joy to a caring visit",
    category: "Hospital Events",
    order: 4,
    featured: false,
    filePath: "src/assets/santa-wade.jpg",
  },
  {
    _id: "starter-service-community-events",
    title: "Community Events",
    description:
      "North Star Santa participates in parades, tree lightings, HOA neighborhood gatherings, and community celebrations with a polished presence that keeps the Christmas spirit front and center.",
    imageAlt: "North Star Santa appearing at a community Christmas event",
    category: "Community Events",
    order: 5,
    featured: false,
    filePath: "src/assets/IMG_9947.jpeg",
  },
  {
    _id: "starter-service-meals-with-santa",
    title: "Breakfast, Lunch & Dinner with Santa",
    description:
      "Meal events with Santa become relaxed, joyful traditions where families can gather, visit, take photos, and enjoy a personal Christmas moment without feeling rushed.",
    imageAlt: "Christmas setting for a Santa meal event",
    category: "Meals with Santa",
    order: 6,
    featured: false,
    filePath: "src/assets/carolina-pines-1.jpg",
  },
];

const helpfulHints = [
  { _id: "starter-helpful-hint-comfortable", title: "Keep It Comfortable", description: "Maintain room temperature at or below 68°F to ensure everyone's comfort during the visit.", order: 1 },
  { _id: "starter-helpful-hint-chair", title: "Sturdy Chair Required", description: "Provide a sturdy chair — no recliners or wheels. Place it near your Christmas tree for great photo backgrounds with enough space for people to stand nearby.", order: 2 },
  { _id: "starter-helpful-hint-gifts", title: "Gift Distribution", description: "If you'd like Santa to distribute presents, communicate where they're located. Ensure packages have names clearly printed. Consider a helper. Securely tape tags — avoid gift bags as items can fall out.", order: 3 },
  { _id: "starter-helpful-hint-children", title: "Prepare the Children", description: "Keep children inside and away from windows when Santa arrives. This preserves the magic — they won't see Santa getting out of his \"sleigh.\"", order: 4 },
  { _id: "starter-helpful-hint-photos", title: "Photos Welcome", description: "Take as many pictures as you'd like. If a child is upset, work with Santa to find a creative solution. Consider putting dogs in another room for a calm atmosphere.", order: 5 },
  { _id: "starter-helpful-hint-present", title: "Everyone Present", description: "Ensure all intended participants are present before Santa arrives. Santa can call or text when he's on his way so everyone is ready.", order: 6 },
  { _id: "starter-helpful-hint-parking", title: "Designated Parking", description: "Create a specific, convenient parking spot near the entrance for a smooth and magical arrival.", order: 7 },
  { _id: "starter-helpful-hint-pets", title: "Pets", description: "Not all pets are comfortable around strangers in elaborate suits. Keep pets in a separate room for their safety and to prevent stress or accidents.", order: 8 },
];

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);

const upsertDocument = async (document) => {
  const existing = await client.getDocument(document._id);
  const { _id, ...patchableFields } = document;

  if (existing) {
    await client.patch(_id).set(patchableFields).commit();
    console.log(`Updated ${document._type}: ${document._id}`);
    return;
  }

  await client.create(document);
  console.log(`Created ${document._type}: ${document._id}`);
};

const uploadImageForDocument = async ({ _id, _type, filePath }) => {
  const existing = await client.getDocument(_id);
  const existingRef = existing?.image?.asset?._ref;

  if (existingRef) {
    console.log(`Reusing existing image asset for ${_type}: ${_id}`);
    return existingRef;
  }

  const absolutePath = path.join(rootDir, filePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Missing local image asset: ${filePath}`);
  }

  const asset = await client.assets.upload("image", createReadStream(absolutePath), {
    filename: path.basename(absolutePath),
  });

  console.log(`Uploaded image asset for ${_type}: ${_id}`);
  return asset._id;
};

for (const testimonial of testimonials) {
  await upsertDocument(testimonial);
}

for (const photo of galleryPhotos) {
  const assetRef = await uploadImageForDocument({ ...photo, _type: "galleryPhoto" });
  await upsertDocument({
    _id: photo._id,
    _type: "galleryPhoto",
    title: photo.title,
    caption: photo.caption,
    image: {
      _type: "image",
      asset: {
        _type: "reference",
        _ref: assetRef,
      },
    },
    submittedBy: "North Star Santa",
    approved: true,
    featured: photo.featured,
    submittedAt: seedDate,
  });
}

for (const service of services) {
  const assetRef = await uploadImageForDocument({ ...service, _type: "service" });
  await upsertDocument({
    _id: service._id,
    _type: "service",
    title: service.title,
    description: service.description,
    image: {
      _type: "image",
      asset: {
        _type: "reference",
        _ref: assetRef,
      },
    },
    imageAlt: service.imageAlt,
    category: service.category,
    order: service.order,
    active: true,
    featured: service.featured,
    slug: {
      _type: "slug",
      current: slugify(service.title),
    },
  });
}

for (const hint of helpfulHints) {
  await upsertDocument({
    _id: hint._id,
    _type: "helpfulHint",
    title: hint.title,
    description: hint.description,
    order: hint.order,
    active: true,
  });
}

console.log(`Seed complete for Sanity project ${projectId}, dataset ${dataset}.`);
