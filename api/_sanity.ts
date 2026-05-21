import { createClient } from "@sanity/client";

const projectId = process.env.SANITY_PROJECT_ID || process.env.VITE_SANITY_PROJECT_ID || "wme1a7n3";
const dataset = process.env.SANITY_DATASET || process.env.VITE_SANITY_DATASET || "production";
const apiVersion = process.env.VITE_SANITY_API_VERSION || "2025-01-01";
const token = process.env.SANITY_WRITE_TOKEN;

export const sanityProjectId = projectId;

export const sanityWriteClient = () => {
  if (!projectId || !dataset || !token) {
    throw new Error("Missing Sanity environment variables.");
  }

  return createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
  });
};

export const readJsonBody = async <T>(req: NodeJS.ReadableStream): Promise<T> => {
  if ("body" in req && (req as { body?: unknown }).body) {
    const body = (req as { body?: unknown }).body;
    return (typeof body === "string" ? JSON.parse(body) : body) as T;
  }

  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as T;
};

export const cleanText = (value: unknown, maxLength = 500) => {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
};

export const parseDataUrlImage = (dataUrl: string) => {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

  if (!match) {
    throw new Error("Invalid image upload.");
  }

  const [, mimeType, base64] = match;
  const buffer = Buffer.from(base64, "base64");

  if (buffer.length > 5 * 1024 * 1024) {
    throw new Error("Image uploads must be 5MB or smaller.");
  }

  return { buffer, mimeType };
};
