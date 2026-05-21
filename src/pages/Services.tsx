import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import CtaBanner from "@/components/CtaBanner";
import { fallbackServices } from "@/lib/localContent";
import { getActiveServices, type Service } from "@/lib/sanityQueries";

const Services = () => {
  const [services, setServices] = useState<Service[]>(fallbackServices);

  useEffect(() => {
    const loadServices = async () => {
      try {
        const rows = await getActiveServices();
        setServices(rows.length > 0 ? rows : fallbackServices);
      } catch {
        setServices(fallbackServices);
      }
    };

    loadServices();
  }, []);

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
                  src={s.imageUrl || fallbackServices[i % fallbackServices.length].imageUrl}
                  alt={s.imageAlt || s.title}
                  width={900}
                  height={675}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3] w-full rounded-lg object-cover shadow-elegant border border-border"
                  style={{ objectPosition: s.imagePosition || "center top" }}
                />
                <div>
                  <p className="text-gold uppercase tracking-[0.25em] text-xs font-bold mb-3">
                    Service {i + 1}
                  </p>
                  <h2 className="font-display text-3xl md:text-4xl text-secondary mb-5">{s.title}</h2>
                  <p className="text-lg leading-relaxed text-foreground/85">{s.description}</p>
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
