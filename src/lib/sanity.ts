const projectId = import.meta.env.VITE_SANITY_PROJECT_ID;
const dataset = import.meta.env.VITE_SANITY_DATASET;
const apiVersion = import.meta.env.VITE_SANITY_API_VERSION || "2025-01-01";

export const isSanityConfigured = Boolean(projectId && dataset);

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

const getQueryUrl = (query: string) => {
  if (!projectId || !dataset) {
    throw new Error("Sanity is not configured.");
  }

  const url = new URL(`https://${projectId}.api.sanity.io/${apiVersion}/data/query/${dataset}`);
  url.searchParams.set("query", query);
  return url.toString();
};

const fetchSanityQuery = async <T>(query: string): Promise<T> => {
  const response = await fetch(getQueryUrl(query));

  if (!response.ok) {
    throw new Error(`Sanity read failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as { result: T };
  return payload.result;
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
