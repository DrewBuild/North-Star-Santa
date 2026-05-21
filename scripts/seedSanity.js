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

const uploadImageForPhoto = async (photo) => {
  const existing = await client.getDocument(photo._id);
  const existingRef = existing?.image?.asset?._ref;

  if (existingRef) {
    console.log(`Reusing existing image asset for galleryPhoto: ${photo._id}`);
    return existingRef;
  }

  const absolutePath = path.join(rootDir, photo.filePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Missing local image asset: ${photo.filePath}`);
  }

  const asset = await client.assets.upload("image", createReadStream(absolutePath), {
    filename: path.basename(absolutePath),
  });

  console.log(`Uploaded image asset for galleryPhoto: ${photo._id}`);
  return asset._id;
};

for (const testimonial of testimonials) {
  await upsertDocument(testimonial);
}

for (const photo of galleryPhotos) {
  const assetRef = await uploadImageForPhoto(photo);
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

console.log(`Seed complete for Sanity project ${projectId}, dataset ${dataset}.`);
