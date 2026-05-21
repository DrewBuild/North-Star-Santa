import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Snow from "@/components/Snow";
import Reveal from "@/components/Reveal";
import CtaBanner from "@/components/CtaBanner";
import { Home as HomeIcon, Building2, Heart, ArrowRight } from "lucide-react";
import { bioPhotos, fallbackServices, heroSantaImg, withRequestedServicePhotoSwap } from "@/lib/localContent";
import { getFeaturedServices, type Service } from "@/lib/sanityQueries";

const bioBlocks = [
  {
    label: "Who He Is",
    text: "North Star Santa is no ordinary Santa Claus! Whether you're hosting a Christmas event, an HOA party, a school celebration, or a corporate party, North Star Santa is the perfect choice to make your occasion unforgettable. North Star Santa is the ideal choice to infuse your occasion with the spirit of Christmas.",
  },
  {
    label: "The Professional",
    text: "North Star Santa is a Professional! A graduate of Pro Santa School and World Santa Claus Network. He takes great pride in his custom-crafted red and white suit, belt with shiny buckle, suspenders, and antique brass sleigh bells on his boots!",
  },
  {
    label: "The Experience",
    text: "North Star Santa is Enthusiastic! He connects naturally with your guests, captivates them with heartfelt stories, and leaves a trail of genuine joy in every interaction. His joyful laughter and signature belly laugh have delighted countless children, and he carries a remarkable talent for spreading joy and Christmas magic wherever he appears.",
  },
];

const serviceIcons = [HomeIcon, Building2, Heart];
const fallbackFeaturedServices = withRequestedServicePhotoSwap(fallbackServices.slice(0, 3));

const Home = () => {
  const [services, setServices] = useState<Service[]>(fallbackFeaturedServices);

  useEffect(() => {
    const loadServices = async () => {
      try {
        const rows = await getFeaturedServices();
        setServices(rows.length > 0 ? withRequestedServicePhotoSwap(rows) : fallbackFeaturedServices);
      } catch {
        setServices(fallbackFeaturedServices);
      }
    };

    loadServices();
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <img
          src={heroSantaImg}
          alt="North Star Santa in a Christmas setting"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover object-[center_38%]"
        />
        <div className="absolute inset-0 bg-gradient-hero" />
        <Snow count={22} />
        <div className="relative container min-h-[78vh] md:min-h-[88vh] flex flex-col items-center justify-center text-center py-24">
          <p className="text-gold/90 tracking-[0.4em] uppercase text-xs md:text-sm mb-4 animate-fade-in">
            ⋆ Professional Santa Claus ⋆
          </p>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-gold drop-shadow-lg animate-fade-in">
            North Star Santa
          </h1>
          <p className="mt-6 max-w-2xl text-lg md:text-2xl text-primary-foreground/95 font-display italic animate-fade-in">
            Making Christmas Magic Unforgettable
          </p>
          <div className="mt-10 animate-fade-in">
            <Button asChild variant="hero" size="xl" className="pulse-gold">
              <Link to="/book">Book Santa Now</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Bio */}
      <section className="bg-festive-cream">
        <div className="container py-20 md:py-28 space-y-16 md:space-y-24">
          {bioBlocks.map((b, i) => {
            const flipped = i % 2 === 1;
            return (
              <Reveal key={b.label}>
                <div className={`grid md:grid-cols-2 gap-10 md:gap-16 items-center ${flipped ? "md:[&>*:first-child]:order-2" : ""}`}>
                  <div>
                    <h2 className="font-display text-3xl md:text-4xl text-secondary mb-5">
                      {b.label}
                    </h2>
                    <p className="text-lg leading-relaxed text-foreground/85">{b.text}</p>
                  </div>
                  <div className="flex justify-center">
                    <img
                      src={bioPhotos[i].imageUrl}
                      alt={bioPhotos[i].alt}
                      width={320}
                      height={320}
                      loading="lazy"
                      decoding="async"
                      className="w-64 h-64 md:w-80 md:h-80 rounded-full object-cover shadow-elegant border border-border"
                      style={{ objectPosition: bioPhotos[i].position }}
                    />
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Services Teaser */}
      <section className="bg-festive-red-gold py-20 md:py-24">
        <div className="container">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="text-gold uppercase tracking-[0.25em] text-xs font-bold mb-3">What We Offer</p>
              <h2 className="font-display text-4xl md:text-5xl text-secondary">A Santa for Every Occasion</h2>
            </div>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-3 md:gap-8">
            {services.map((s, i) => {
              const Icon = serviceIcons[i % serviceIcons.length];
              const fallback = fallbackFeaturedServices[i % fallbackFeaturedServices.length];

              return (
              <Reveal key={s.id || s.title} delay={i * 100}>
                <div className="group h-full bg-card border border-border rounded-lg p-8 shadow-card hover:shadow-elegant hover:-translate-y-1 transition-all">
                  <img
                    src={s.imageUrl || fallback.imageUrl}
                    alt={s.imageAlt || s.title}
                    width={800}
                    height={600}
                    loading="lazy"
                    decoding="async"
                    className="mb-6 aspect-[4/3] w-full rounded-md object-cover shadow-card"
                    style={{ objectPosition: s.imagePosition || "center top" }}
                  />
                  <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-2xl text-secondary mb-3">{s.title}</h3>
                  <p className="text-foreground/75 mb-6">{s.description}</p>
                  <Link
                    to="/services"
                    className="inline-flex items-center gap-1 text-primary font-semibold hover:gap-2 transition-all"
                  >
                    Learn More <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <CtaBanner />
    </>
  );
};

export default Home;
