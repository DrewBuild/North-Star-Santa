import heroSantaImg from "@/assets/hero-santa.png";
import logoImg from "@/assets/north-star-santa-logo.png";
import carolinaPinesImg from "@/assets/carolina-pines-1.jpg";
import santaWadeImg from "@/assets/santa-wade.jpg";
import img0960 from "@/assets/IMG_0960.jpeg";
import img2658 from "@/assets/IMG_2658.jpeg";
import img9520 from "@/assets/IMG_9520.jpeg";
import img9947 from "@/assets/IMG_9947.jpeg";
import type { GalleryPhoto, Testimonial } from "@/lib/sanityQueries";

export { heroSantaImg, logoImg };

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

export const servicePhotos = [
  {
    title: "Home Visits",
    imageUrl: img0960,
    alt: "Santa Wade creating a magical home visit experience",
    position: "center top",
  },
  {
    title: "Corporate Parties",
    imageUrl: img2658,
    alt: "North Star Santa ready for a polished corporate Christmas event",
    position: "center top",
  },
  {
    title: "School Events",
    imageUrl: img9520,
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
