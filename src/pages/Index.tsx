import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Snow from "@/components/Snow";
import Reveal from "@/components/Reveal";
import CtaBanner from "@/components/CtaBanner";
import ChristmasCountdown from "@/components/ChristmasCountdown";
import { Home as HomeIcon, Building2, Heart, ArrowRight } from "lucide-react";
import { bioPhotos, fallbackServices, heroSantaCutoutImg, heroSantaImg, withRequestedServicePhotoSwap } from "@/lib/localContent";
import { getFeaturedServices, type Service } from "@/lib/sanityQueries";
import titleImg from "@/assets/title.png";

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
        <div className="relative container min-h-[82vh] pb-0 pt-20 md:min-h-[90vh] md:pt-24 lg:pt-24">
          <div className="grid min-h-[calc(82vh-5rem)] items-center gap-10 md:min-h-[calc(90vh-6rem)] lg:grid-cols-[minmax(0,1fr)_minmax(360px,520px)] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(430px,600px)]">
            <div className="relative z-10 flex flex-col items-center self-center pb-8 text-center md:pb-10 lg:items-start lg:pb-20 lg:text-left xl:pb-24">
              <p className="hero-kicker-glow mb-5 text-xs font-extrabold uppercase tracking-[0.42em] text-gold md:text-sm lg:text-[0.95rem] animate-fade-in">
                ⋆ Professional Santa Claus ⋆
              </p>
              <h1 className="animate-fade-in">
                <img
                  src={titleImg}
                  alt="North Star Santa making Christmas magic unforgettable"
                  width={2508}
                  height={627}
                  className="hero-title-image"
                />
              </h1>
            </div>

            <div className="santa-hero-figure z-0 mx-auto -mb-1 self-end">
              <div className="absolute bottom-[10%] h-[86%] w-[90%] rounded-full bg-gold/30 blur-3xl" aria-hidden="true" />
              <div className="absolute -right-[4%] bottom-[18%] h-[58%] w-[55%] rounded-full bg-secondary/25 blur-3xl" aria-hidden="true" />
              <div className="absolute -left-[2%] bottom-[16%] h-[52%] w-[48%] rounded-full bg-primary/25 blur-3xl" aria-hidden="true" />
              <div className="absolute bottom-0 h-20 w-[88%] rounded-full bg-black/35 blur-2xl md:h-24 lg:h-28" aria-hidden="true" />
              <div className="absolute bottom-[10%] h-[76%] w-[82%] rounded-full border border-gold/20 opacity-60 blur-sm" aria-hidden="true" />
              <img
                src={heroSantaCutoutImg}
                alt="North Star Santa welcoming guests"
                width={433}
                height={577}
                className="santa-hero-image hero-santa-glow relative z-10"
              />
              <ChristmasCountdown />
            </div>
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
