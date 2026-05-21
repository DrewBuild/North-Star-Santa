import { createClient } from "@sanity/client";

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID;
const dataset = import.meta.env.VITE_SANITY_DATASET;
const apiVersion = import.meta.env.VITE_SANITY_API_VERSION || "2025-01-01";

// Use hardcoded fallbacks so isSanityConfigured is accurate in all environments
const effectiveProjectId = projectId || "wme1a7n3";
const effectiveDataset = dataset || "production";

export const isSanityConfigured = Boolean(effectiveProjectId && effectiveDataset);

export const sanityClient = createClient({
  projectId: effectiveProjectId,
  dataset: effectiveDataset,
  apiVersion,
  useCdn: true,
});

// Bypass CDN for availability data so newly created blockout dates
// are visible immediately without waiting for cache to expire.
const sanityLiveClient = createClient({
  projectId: effectiveProjectId,
  dataset: effectiveDataset,
  apiVersion,
  useCdn: false,
});

export interface Testimonial {
  id: string;
  name: string;
  reviewText: string;
  organization?: string | null;
  location?: string | null;
  featured?: boolean;
  submittedAt?: string;
}

export interface GalleryPhoto {
  id: string;
  title?: string | null;
  imageUrl: string;
  caption?: string | null;
  submittedBy?: string | null;
  featured?: boolean;
  submittedAt?: string;
  imageFit?: "cover" | "contain";
  imagePosition?: string;
}

export interface SiteSettings {
  siteName?: string | null;
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  contactEmail?: string | null;
  phone?: string | null;
  logoUrl?: string | null;
}

export interface BlockoutDate {
  id: string;
  title: string;
  startDate: string;
  endDate: string | null;
  isFullDay: boolean;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
  active: boolean;
  repeatYearly: boolean;
}

export interface BookingSettings {
  first_business_date: string | null;
  last_business_date: string | null;
}

export interface AvailabilityDay {
  day_of_week: number;
  is_available: boolean;
  start_time: string;
  end_time: string;
}

export interface BlockedDate {
  id: string;
  blocked_date: string;
  reason: string | null;
}

export interface BookedSlot {
  event_date: string;
  event_time: string;
  status: "New" | "Contacted" | "Booked";
}

const defaultAvailability: AvailabilityDay[] = [
  { day_of_week: 0, is_available: true, start_time: "09:00", end_time: "20:00" },
  { day_of_week: 1, is_available: true, start_time: "09:00", end_time: "20:00" },
  { day_of_week: 2, is_available: true, start_time: "09:00", end_time: "20:00" },
  { day_of_week: 3, is_available: true, start_time: "09:00", end_time: "20:00" },
  { day_of_week: 4, is_available: true, start_time: "09:00", end_time: "20:00" },
  { day_of_week: 5, is_available: true, start_time: "09:00", end_time: "20:00" },
  { day_of_week: 6, is_available: true, start_time: "09:00", end_time: "20:00" },
];

export const getDefaultAvailability = () => defaultAvailability;

const fetchSanityQuery = async <T>(query: string): Promise<T> => {
  if (!isSanityConfigured) {
    throw new Error("Sanity is not configured.");
  }

  return sanityClient.fetch<T>(query);
};

export const getApprovedTestimonials = async () => {
  if (!isSanityConfigured) return [];

  return fetchSanityQuery<Testimonial[]>(`
    *[_type == "testimonial" && approved == true]
      | order(featured desc, submittedAt desc)[0...24]{
        "id": _id,
        name,
        reviewText,
        organization,
        location,
        featured,
        submittedAt
      }
  `);
};

export const getApprovedGalleryPhotos = async (limit = 24) => {
  if (!isSanityConfigured) return [];

  return fetchSanityQuery<GalleryPhoto[]>(`
    *[_type == "galleryPhoto" && approved == true]
      | order(featured desc, submittedAt desc)[0...${limit}]{
        "id": _id,
        title,
        "imageUrl": image.asset->url,
        caption,
        submittedBy,
        featured,
        submittedAt
      }
  `);
};

export const getFeaturedTestimonials = async () => {
  if (!isSanityConfigured) return [];

  return fetchSanityQuery<Testimonial[]>(`
    *[_type == "testimonial" && approved == true && featured == true]
      | order(submittedAt desc)[0...6]{
        "id": _id,
        name,
        reviewText,
        organization,
        location,
        featured,
        submittedAt
      }
  `);
};

export const getSiteSettings = async () => {
  if (!isSanityConfigured) return null;

  const results = await fetchSanityQuery<SiteSettings[]>(`
    *[_type == "siteSettings"][0]{
      siteName,
      heroTitle,
      heroSubtitle,
      contactEmail,
      phone,
      "logoUrl": logo.asset->url
    }
  `);

  return results ?? null;
};

export const getBookedSlots = async () => {
  if (!isSanityConfigured) return [];

  return fetchSanityQuery<BookedSlot[]>(`
    *[_type == "bookingRequest" && status in ["New", "Contacted", "Booked"]]{
      "event_date": eventDate,
      "event_time": eventTime,
      status
    }
  `);
};

export const getActiveBlockoutDates = async (): Promise<BlockoutDate[]> => {
  if (!isSanityConfigured) return [];

  // Use the live (non-CDN) client so newly created blockout dates are
  // visible immediately rather than waiting for edge cache to expire.
  // Use active != false so documents where active was never explicitly saved
  // (null/undefined) are still treated as active.
  const result = await sanityLiveClient.fetch<BlockoutDate[]>(`
    *[_type == "blockoutDate" && active != false]{
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
  `);
  return result ?? [];
};

export const normalizeDate = (dateValue: string | Date | null | undefined): string => {
  if (!dateValue) return "";
  if (typeof dateValue === "string") return dateValue.slice(0, 10);
  return dateValue.toISOString().slice(0, 10);
};

export const getMonthDay = (dateString: string): string => {
  const normalized = normalizeDate(dateString);
  return normalized ? normalized.slice(5, 10) : "";
};

export const isDateBlocked = (
  selectedDate: string | null | undefined,
  blockouts: BlockoutDate[] | undefined | null = [],
): boolean => {
  const selected = normalizeDate(selectedDate);
  if (!selected || !blockouts || blockouts.length === 0) return false;

  const selectedMonthDay = getMonthDay(selected);

  return blockouts.some((blockout) => {
    if (!blockout || blockout.active === false) return false;

    const start = normalizeDate(blockout.startDate);
    const end = normalizeDate(blockout.endDate || blockout.startDate);

    if (!start) return false;

    if (blockout.repeatYearly) {
      const startMD = getMonthDay(start);
      const endMD = getMonthDay(end);
      if (!endMD || startMD === endMD) return selectedMonthDay === startMD;
      return selectedMonthDay >= startMD && selectedMonthDay <= endMD;
    }

    return selected >= start && selected <= end;
  });
};
