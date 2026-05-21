import { isSanityConfigured, sanityClient } from "@/lib/sanityClient";

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

export const BLOCKED_TIME_MESSAGE = "That time is unavailable. Please choose another time.";
export const BLOCKED_DATE_MESSAGE = "Santa is unavailable on this date. Please choose another date.";

export interface AvailabilityDay {
  day_of_week: number;
  is_available: boolean;
  start_time: string;
  end_time: string;
}

export interface BookedSlot {
  event_date: string;
  event_time: string;
  status: "New" | "Contacted" | "Booked";
}

export interface SanityReadDebugSnapshot {
  testimonialQuery: string;
  galleryQuery: string;
  testimonials: Testimonial[];
  galleryPhotos: GalleryPhoto[];
}

export const approvedTestimonialsQuery = `
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
`;

export const approvedGalleryPhotosQuery = (limit = 24) => `
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
`;

export const featuredTestimonialsQuery = `
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
`;

export const siteSettingsQuery = `
  *[_type == "siteSettings" && !(_id in path("drafts.**"))][0]{
    siteName,
    heroTitle,
    heroSubtitle,
    contactEmail,
    phone,
    "logoUrl": logo.asset->url
  }
`;

export const bookedSlotsQuery = `
  *[_type == "bookingRequest" && status in ["New", "Contacted", "Booked"]]{
    "event_date": eventDate,
    "event_time": eventTime,
    status
  }
`;

export const activeBlockoutsQuery = `
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
`;

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

const fetchSanityQuery = async <T>(
  label: string,
  query: string,
  apiKind: string,
  params?: Record<string, unknown>,
): Promise<T> => {
  if (!isSanityConfigured) {
    throw new Error("Sanity is not configured.");
  }

  if (import.meta.env.DEV) {
    console.log(`[sanity:${label}] query`, query);
  }

  const result =
    typeof window === "undefined"
      ? await sanityClient.fetch<T>(query)
      : await fetchSanityRead<T>(apiKind, params);

  if (import.meta.env.DEV) {
    console.log(`[sanity:${label}] result count`, Array.isArray(result) ? result.length : result ? 1 : 0);
    console.log(`[sanity:${label}] result data`, result);
  }

  return result;
};

const fetchSanityRead = async <T>(kind: string, params?: Record<string, unknown>): Promise<T> => {
  const response = await fetch("/api/sanity-read", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, params }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error || `Sanity read failed for ${kind}.`);
  }

  return payload.data as T;
};

export const getApprovedTestimonials = async () => {
  if (!isSanityConfigured) return [];

  const rows = await fetchSanityQuery<Testimonial[]>(
    "approved-testimonials",
    approvedTestimonialsQuery,
    "approvedTestimonials",
  );
  return rows;
};

export const getApprovedGalleryPhotos = async (limit = 24) => {
  if (!isSanityConfigured) return [];

  const rows = await fetchSanityQuery<GalleryPhoto[]>(
    "approved-gallery-photos",
    approvedGalleryPhotosQuery(limit),
    "approvedGalleryPhotos",
    { limit },
  );
  return rows;
};

export const getFeaturedTestimonials = async () => {
  if (!isSanityConfigured) return [];

  const rows = await fetchSanityQuery<Testimonial[]>(
    "featured-testimonials",
    featuredTestimonialsQuery,
    "featuredTestimonials",
  );
  return rows;
};

export const getSiteSettings = async () => {
  if (!isSanityConfigured) return null;

  const result = await fetchSanityQuery<SiteSettings | null>(
    "site-settings",
    siteSettingsQuery,
    "siteSettings",
  );
  return result;
};

export const getBookedSlots = async () => {
  if (!isSanityConfigured) return [];

  const rows = await fetchSanityQuery<BookedSlot[]>("booked-slots", bookedSlotsQuery, "bookedSlots");
  return rows;
};

export const getActiveBlockoutDates = async (): Promise<BlockoutDate[]> => {
  if (!isSanityConfigured) return [];

  const rows = await fetchSanityQuery<BlockoutDate[]>(
    "active-blockouts",
    activeBlockoutsQuery,
    "activeBlockouts",
  );
  return rows ?? [];
};

export const getSanityReadDebugSnapshot = async (): Promise<SanityReadDebugSnapshot> => {
  const testimonialQuery = approvedTestimonialsQuery;
  const galleryQuery = approvedGalleryPhotosQuery();
  const [testimonials, galleryPhotos] = await Promise.all([
    fetchSanityQuery<Testimonial[]>("debug-approved-testimonials", testimonialQuery, "approvedTestimonials"),
    fetchSanityQuery<GalleryPhoto[]>("debug-approved-gallery-photos", galleryQuery, "approvedGalleryPhotos"),
  ]);

  return {
    testimonialQuery,
    galleryQuery,
    testimonials,
    galleryPhotos,
  };
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
  return isFullDayBlocked(selectedDate, blockouts);
};

export const isDateInBlockout = (
  selectedDate: string | null | undefined,
  blockout: Pick<BlockoutDate, "active" | "startDate" | "endDate" | "repeatYearly"> | null | undefined,
): boolean => {
  const selected = normalizeDate(selectedDate);
  if (!selected || !blockout || blockout.active === false) return false;

  const selectedMonthDay = getMonthDay(selected);
  const start = normalizeDate(blockout.startDate);
  const end = normalizeDate(blockout.endDate || blockout.startDate);

  if (!start) return false;

  if (blockout.repeatYearly) {
    const startMD = getMonthDay(start);
    const endMD = getMonthDay(end);
    if (!endMD || startMD === endMD) return selectedMonthDay === startMD;
    if (startMD < endMD) return selectedMonthDay >= startMD && selectedMonthDay <= endMD;
    return selectedMonthDay >= startMD || selectedMonthDay <= endMD;
  }

  return selected >= start && selected <= end;
};

export const isFullDayBlocked = (
  selectedDate: string | null | undefined,
  blockouts: BlockoutDate[] | undefined | null = [],
): boolean => {
  if (!selectedDate || !blockouts || blockouts.length === 0) return false;

  return blockouts.some((blockout) => blockout.isFullDay !== false && isDateInBlockout(selectedDate, blockout));
};

export const isTimeBlocked = (
  selectedDate: string | null | undefined,
  selectedTime: string | null | undefined,
  blockouts: BlockoutDate[] | undefined | null = [],
): boolean => {
  const normalizedTime = typeof selectedTime === "string" ? selectedTime.slice(0, 5) : "";
  if (!selectedDate || !normalizedTime || !blockouts || blockouts.length === 0) return false;

  return blockouts.some((blockout) => {
    if (blockout.isFullDay !== false || !isDateInBlockout(selectedDate, blockout)) return false;

    const startTime = (blockout.startTime || "").slice(0, 5);
    const endTime = (blockout.endTime || "").slice(0, 5);

    if (!startTime && !endTime) return false;
    if (startTime && !endTime) return normalizedTime === startTime;
    if (!startTime && endTime) return normalizedTime < endTime;
    return normalizedTime >= startTime && normalizedTime < endTime;
  });
};
