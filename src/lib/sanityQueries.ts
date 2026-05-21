import { isSanityConfigured, sanityClient } from "@/lib/sanityClient";

const logSanity = (...args: unknown[]) => {
  if (import.meta.env.DEV) console.log(...args);
};

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

  const rows = await fetchSanityQuery<Testimonial[]>(`
    *[_type == "testimonial" && approved == true && !(_id in path("drafts.**"))]
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
  logSanity("[sanity] approved testimonials fetched:", rows.length);
  return rows;
};

export const getApprovedGalleryPhotos = async (limit = 24) => {
  if (!isSanityConfigured) return [];

  const rows = await fetchSanityQuery<GalleryPhoto[]>(`
    *[_type == "galleryPhoto" && approved == true && defined(image.asset) && !(_id in path("drafts.**"))]
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
  logSanity("[sanity] approved gallery photos fetched:", rows.length);
  return rows;
};

export const getFeaturedTestimonials = async () => {
  if (!isSanityConfigured) return [];

  const rows = await fetchSanityQuery<Testimonial[]>(`
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
  `);
  logSanity("[sanity] featured testimonials fetched:", rows.length);
  return rows;
};

export const getSiteSettings = async () => {
  if (!isSanityConfigured) return null;

  const result = await fetchSanityQuery<SiteSettings | null>(`
    *[_type == "siteSettings" && !(_id in path("drafts.**"))][0]{
      siteName,
      heroTitle,
      heroSubtitle,
      contactEmail,
      phone,
      "logoUrl": logo.asset->url
    }
  `);
  logSanity("[sanity] site settings fetched:", Boolean(result));
  return result;
};

export const getBookedSlots = async () => {
  if (!isSanityConfigured) return [];

  const rows = await fetchSanityQuery<BookedSlot[]>(`
    *[_type == "bookingRequest" && status in ["New", "Contacted", "Booked"]]{
      "event_date": eventDate,
      "event_time": eventTime,
      status
    }
  `);
  logSanity("[sanity] booked slots fetched:", rows.length);
  return rows;
};

export const getActiveBlockoutDates = async (): Promise<BlockoutDate[]> => {
  if (!isSanityConfigured) return [];

  const rows = await sanityClient.fetch<BlockoutDate[]>(`
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
  `);
  logSanity("[sanity] active blockout dates fetched:", rows.length);
  return rows ?? [];
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
