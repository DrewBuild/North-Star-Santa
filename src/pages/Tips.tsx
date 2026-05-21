import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import { fallbackHelpfulHints } from "@/lib/localContent";
import { getActiveHelpfulHints, type HelpfulHint } from "@/lib/sanityQueries";

const Tips = () => {
  const [tips, setTips] = useState<HelpfulHint[]>(fallbackHelpfulHints);

  useEffect(() => {
    const loadTips = async () => {
      try {
        const rows = await getActiveHelpfulHints();
        setTips(rows.length > 0 ? rows : fallbackHelpfulHints);
      } catch {
        setTips(fallbackHelpfulHints);
      }
    };

    loadTips();
  }, []);

  return (
    <>
      <section className="bg-secondary text-secondary-foreground py-16 md:py-20 text-center">
        <div className="container">
          <p className="text-gold uppercase tracking-[0.3em] text-xs font-bold mb-3">Helpful Hints</p>
          <h1 className="font-display text-4xl md:text-6xl text-gold">Tips for a Great Santa Visit</h1>
          <p className="mt-4 text-secondary-foreground/85 max-w-xl mx-auto">
            A few simple steps to make the magic perfect
          </p>
        </div>
      </section>

      <section className="container py-16 md:py-20">
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {tips.map((tip, i) => (
            <Reveal key={tip.title} delay={(i % 2) * 80}>
              <article className="h-full bg-card border border-border rounded-lg p-8 shadow-card hover:shadow-elegant hover:-translate-y-1 transition-all flex gap-5">
                <div className="font-display text-6xl md:text-7xl text-gold leading-none select-none">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-display text-2xl text-secondary mb-2">{tip.title}</h3>
                  <p className="text-foreground/80 leading-relaxed">{tip.description}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
};

export default Tips;
