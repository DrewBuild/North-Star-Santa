import heroSantaImg from "@/assets/hero-santa.png";
import heroSantaCutoutImg from "@/assets/HomeScreensanta.png";
import logoImg from "@/assets/Santa_logo-removebg-preview.png";
import carolinaPinesImg from "@/assets/carolina-pines-1.jpg";
import santaWadeImg from "@/assets/santa-wade.jpg";
import img0960 from "@/assets/IMG_0960.jpeg";
import img2658 from "@/assets/IMG_2658.jpeg";
import img9520 from "@/assets/IMG_9520.jpeg";
import img9947 from "@/assets/IMG_9947.jpeg";
import type { GalleryPhoto, HelpfulHint, Service, Testimonial } from "@/lib/sanityQueries";

export { heroSantaImg, heroSantaCutoutImg, logoImg };

export const realTestimonials: Testimonial[] = [
  {
    id: "erin-q",
    name: "Erin Q.",
    reviewText:
      "Santa's visit to our home before Christmas was truly magical. He was kind, patient, and wonderful with the children - reading stories, singing songs, decorating cookies, and even letting them try on his coat. The experience felt personal and unforgettable, and our family will treasure the memories for years to come.",
    featured: true,
  },
  {
    id: "tiffani-s-pik-n-pig",
    name: "Tiffani S.",
    organization: "Pik-N-Pig",
    location: "Carthage, NC",
    reviewText:
      "For over 16 years, our Santa event at Pik-N-Pig has grown into one of the county's top Christmas traditions, and expectations are high. Santa Wade exceeded them all. From flying in on a small plane to immediately jumping into character and creating magic for the children, he handled every moment with warmth and professionalism. We received countless compliments about both the event and our incredible Santa. We're thrilled to have found our future Santa - as long as he'll have us.",
    featured: true,
  },
];

export const localGalleryPhotos: GalleryPhoto[] = [
  {
    id: "local-santa-wade",
    title: "Santa Wade",
    imageUrl: santaWadeImg,
    caption: "Santa Wade bringing classic Christmas warmth to every visit.",
    featured: true,
    imagePosition: "center top",
  },
  {
    id: "local-img-2658",
    title: "Professional Santa portrait",
    imageUrl: img2658,
    caption: "A polished Santa presence for private and professional events.",
    featured: true,
    imagePosition: "center top",
  },
  {
    id: "local-img-0960",
    title: "Christmas magic in action",
    imageUrl: img0960,
    caption: "A joyful experience that feels personal, warm, and memorable.",
    featured: true,
    imagePosition: "center top",
  },
  {
    id: "local-img-9520",
    title: "Santa visit moment",
    imageUrl: img9520,
    caption: "Real holiday moments with North Star Santa.",
    imagePosition: "center top",
  },
  {
    id: "local-img-9947",
    title: "Santa event appearance",
    imageUrl: img9947,
    caption: "Festive appearances for families, schools, and community events.",
    imagePosition: "center top",
  },
  {
    id: "local-carolina-pines",
    title: "Carolina Pines Christmas setting",
    imageUrl: carolinaPinesImg,
    caption: "A warm seasonal setting for Christmas memories.",
    imagePosition: "center center",
  },
];

const servicePhotoData = [
  {
    title: "Home Visits",
    imageUrl: img0960,
    alt: "Santa Wade creating a magical home visit experience",
    position: "center top",
  },
  {
    title: "Corporate Parties",
    imageUrl: img9520,
    alt: "North Star Santa ready for a polished corporate Christmas event",
    position: "center top",
  },
  {
    title: "School Events",
    imageUrl: img2658,
    alt: "North Star Santa at a cheerful school event",
    position: "center top",
  },
  {
    title: "Hospital Events",
    imageUrl: santaWadeImg,
    alt: "Santa Wade bringing warmth and joy to a caring visit",
    position: "center top",
  },
  {
    title: "Community Events",
    imageUrl: img9947,
    alt: "North Star Santa appearing at a community Christmas event",
    position: "center top",
  },
  {
    title: "Breakfast, Lunch & Dinner with Santa",
    imageUrl: carolinaPinesImg,
    alt: "Christmas setting for a Santa meal event",
    position: "center center",
  },
];

export const fallbackServices: Service[] = [
  {
    id: "fallback-service-home-visits",
    title: "Home Visits",
    description:
      "North Star Santa loves Home Visits! Santa is known for his personalized in-home visits, creating a truly magical experience for your children. Before arriving, he gathers special details about each child — favorite colors, teachers, pets, and more — and thoughtfully weaves those personal touches into every conversation, making each visit feel truly one-of-a-kind.",
    imageUrl: servicePhotoData[0].imageUrl,
    imageAlt: servicePhotoData[0].alt,
    imagePosition: servicePhotoData[0].position,
    order: 1,
    active: true,
    featured: true,
  },
  {
    id: "fallback-service-corporate-parties",
    title: "Corporate Parties",
    description:
      "North Star Santa enjoys Corporate Parties! Santa brings a touch of holiday magic to corporate events, Christmas parties, and special gatherings, delighting guests of all ages with his engaging presence and adding a festive charm to every celebration.",
    imageUrl: servicePhotoData[1].imageUrl,
    imageAlt: servicePhotoData[1].alt,
    imagePosition: servicePhotoData[1].position,
    order: 2,
    active: true,
    featured: true,
  },
  {
    id: "fallback-service-school-events",
    title: "School Events",
    description:
      "North Star Santa delights in school events, from classroom visits to larger Christmas programs. His ability to engage even the shyest child makes these visits memorable, warm, and easy for staff to host.",
    imageUrl: servicePhotoData[2].imageUrl,
    imageAlt: servicePhotoData[2].alt,
    imagePosition: servicePhotoData[2].position,
    order: 3,
    active: true,
    featured: true,
  },
  {
    id: "fallback-service-hospital-events",
    title: "Hospital Events",
    description:
      "Santa can bring comfort and joy to children in hospitals during the Christmas season. His cheerful presence helps brighten the spirits of young patients and their families with gentle, caring holiday magic.",
    imageUrl: servicePhotoData[3].imageUrl,
    imageAlt: servicePhotoData[3].alt,
    imagePosition: servicePhotoData[3].position,
    order: 4,
    active: true,
  },
  {
    id: "fallback-service-community-events",
    title: "Community Events",
    description:
      "North Star Santa participates in parades, tree lightings, HOA neighborhood gatherings, and community celebrations with a polished presence that keeps the Christmas spirit front and center.",
    imageUrl: servicePhotoData[4].imageUrl,
    imageAlt: servicePhotoData[4].alt,
    imagePosition: servicePhotoData[4].position,
    order: 5,
    active: true,
  },
  {
    id: "fallback-service-meals-with-santa",
    title: "Breakfast, Lunch & Dinner with Santa",
    description:
      "Meal events with Santa become relaxed, joyful traditions where families can gather, visit, take photos, and enjoy a personal Christmas moment without feeling rushed.",
    imageUrl: servicePhotoData[5].imageUrl,
    imageAlt: servicePhotoData[5].alt,
    imagePosition: servicePhotoData[5].position,
    order: 6,
    active: true,
  },
];

export const withRequestedServicePhotoSwap = (services: Service[]): Service[] =>
  services.map((service) => {
    if (service.title === "Corporate Parties") {
      return {
        ...service,
        imageUrl: servicePhotoData[1].imageUrl,
        imageAlt: service.imageAlt || servicePhotoData[1].alt,
        imagePosition: service.imagePosition || servicePhotoData[1].position,
      };
    }

    if (service.title === "School Events") {
      return {
        ...service,
        imageUrl: servicePhotoData[2].imageUrl,
        imageAlt: service.imageAlt || servicePhotoData[2].alt,
        imagePosition: service.imagePosition || servicePhotoData[2].position,
      };
    }

    return service;
  });

export const fallbackHelpfulHints: HelpfulHint[] = [
  { id: "fallback-hint-comfortable", title: "Keep It Comfortable", description: "Maintain room temperature at or below 68°F to ensure everyone's comfort during the visit.", order: 1, active: true },
  { id: "fallback-hint-chair", title: "Sturdy Chair Required", description: "Provide a sturdy chair — no recliners or wheels. Place it near your Christmas tree for great photo backgrounds with enough space for people to stand nearby.", order: 2, active: true },
  { id: "fallback-hint-gifts", title: "Gift Distribution", description: "If you'd like Santa to distribute presents, communicate where they're located. Ensure packages have names clearly printed. Consider a helper. Securely tape tags — avoid gift bags as items can fall out.", order: 3, active: true },
  { id: "fallback-hint-children", title: "Prepare the Children", description: "Keep children inside and away from windows when Santa arrives. This preserves the magic — they won't see Santa getting out of his \"sleigh.\"", order: 4, active: true },
  { id: "fallback-hint-photos", title: "Photos Welcome", description: "Take as many pictures as you'd like. If a child is upset, work with Santa to find a creative solution. Consider putting dogs in another room for a calm atmosphere.", order: 5, active: true },
  { id: "fallback-hint-present", title: "Everyone Present", description: "Ensure all intended participants are present before Santa arrives. Santa can call or text when he's on his way so everyone is ready.", order: 6, active: true },
  { id: "fallback-hint-parking", title: "Designated Parking", description: "Create a specific, convenient parking spot near the entrance for a smooth and magical arrival.", order: 7, active: true },
  { id: "fallback-hint-pets", title: "Pets", description: "Not all pets are comfortable around strangers in elaborate suits. Keep pets in a separate room for their safety and to prevent stress or accidents.", order: 8, active: true },
];

export const bioPhotos = [
  {
    label: "Who He Is",
    imageUrl: santaWadeImg,
    alt: "Santa Wade smiling in his North Star Santa suit",
    position: "center top",
  },
  {
    label: "The Professional",
    imageUrl: img2658,
    alt: "North Star Santa in professional Santa attire",
    position: "center top",
  },
  {
    label: "The Experience",
    imageUrl: img0960,
    alt: "North Star Santa creating a joyful Christmas experience",
    position: "center top",
  },
];

export const servicePhotos = servicePhotoData;
