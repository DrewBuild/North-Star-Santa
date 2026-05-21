import { createClient } from "@sanity/client";

export const sanityProjectId = import.meta.env.VITE_SANITY_PROJECT_ID || "wme1a7n3";
export const sanityDataset = import.meta.env.VITE_SANITY_DATASET || "production";
export const sanityApiVersion = import.meta.env.VITE_SANITY_API_VERSION || "2025-01-01";

export const sanityClient = createClient({
  projectId: sanityProjectId,
  dataset: sanityDataset,
  apiVersion: sanityApiVersion,
  useCdn: false,
});

export const isSanityConfigured = Boolean(sanityProjectId && sanityDataset);
