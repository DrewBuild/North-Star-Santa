import Reveal from "@/components/Reveal";
import CtaBanner from "@/components/CtaBanner";
import { servicePhotos } from "@/lib/localContent";

const services = [
  {
    title: "Home Visits",
    text: "North Star Santa loves Home Visits! Santa is known for his personalized in-home visits, creating a truly magical experience for your children. Before arriving, he gathers special details about each child — favorite colors, teachers, pets, and more — and thoughtfully weaves those personal touches into every conversation, making each visit feel truly one-of-a-kind.",
    photo: servicePhotos[0],
  },
  {
    title: "Corporate Parties",
    text: "North Star Santa enjoys Corporate Parties! Santa brings a touch of holiday magic to corporate events, Christmas parties, and special gatherings, delighting guests of all ages with his engaging presence and adding a festive charm to every celebration.",
    photo: servicePhotos[1],
  },
  {
    title: "School Events",
    text: "North Star Santa delights in school events, from classroom visits to larger Christmas programs. His ability to engage even the shyest child makes these visits memorable, warm, and easy for staff to host.",
    photo: servicePhotos[2],
  },
  {
    title: "Hospital Events",
    text: "Santa can bring comfort and joy to children in hospitals during the Christmas season. His cheerful presence helps brighten the spirits of young patients and their families with gentle, caring holiday magic.",
    photo: servicePhotos[3],
  },
  {
    title: "Community Events",
    text: "North Star Santa participates in parades, tree lightings, HOA neighborhood gatherings, and community celebrations with a polished presence that keeps the Christmas spirit front and center.",
    photo: servicePhotos[4],
  },
  {
    title: "Breakfast, Lunch & Dinner with Santa",
    text: "Meal events with Santa become relaxed, joyful traditions where families can gather, visit, take photos, and enjoy a personal Christmas moment without feeling rushed.",
    photo: servicePhotos[5],
  },
];

const Services = () => {
  return (
    <>
      <section className="bg-secondary text-secondary-foreground py-16 md:py-20 text-center">
        <div className="container">
          <p className="text-gold uppercase tracking-[0.3em] text-xs font-bold mb-3">Our Services</p>
          <h1 className="font-display text-4xl md:text-6xl text-gold">What North Star Santa Offers</h1>
          <p className="mt-4 text-secondary-foreground/85 max-w-xl mx-auto">
            Personalized experiences for every occasion
          </p>
        </div>
      </section>

      <section className="container py-16 md:py-24 space-y-16 md:space-y-24">
        {services.map((s, i) => {
          const flipped = i % 2 === 1;
          return (
            <Reveal key={s.title}>
              <div className={`grid md:grid-cols-2 gap-10 md:gap-16 items-center ${flipped ? "md:[&>*:first-child]:order-2" : ""}`}>
                <img
                  src={s.photo.imageUrl}
                  alt={s.photo.alt}
                  width={900}
                  height={675}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3] w-full rounded-lg object-cover shadow-elegant border border-border"
                  style={{ objectPosition: s.photo.position }}
                />
                <div>
                  <p className="text-gold uppercase tracking-[0.25em] text-xs font-bold mb-3">
                    Service {i + 1}
                  </p>
                  <h2 className="font-display text-3xl md:text-4xl text-secondary mb-5">{s.title}</h2>
                  <p className="text-lg leading-relaxed text-foreground/85">{s.text}</p>
                </div>
              </div>
            </Reveal>
          );
        })}
      </section>

      <CtaBanner />
    </>
  );
};

export default Services;
