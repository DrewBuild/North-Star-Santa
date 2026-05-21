import Reveal from "@/components/Reveal";

const tips = [
  { title: "Keep It Comfortable", text: "Maintain room temperature at or below 68°F to ensure everyone's comfort during the visit." },
  { title: "Sturdy Chair Required", text: "Provide a sturdy chair — no recliners or wheels. Place it near your Christmas tree for great photo backgrounds with enough space for people to stand nearby." },
  { title: "Gift Distribution", text: "If you'd like Santa to distribute presents, communicate where they're located. Ensure packages have names clearly printed. Consider a helper. Securely tape tags — avoid gift bags as items can fall out." },
  { title: "Prepare the Children", text: "Keep children inside and away from windows when Santa arrives. This preserves the magic — they won't see Santa getting out of his \"sleigh.\"" },
  { title: "Photos Welcome", text: "Take as many pictures as you'd like. If a child is upset, work with Santa to find a creative solution. Consider putting dogs in another room for a calm atmosphere." },
  { title: "Everyone Present", text: "Ensure all intended participants are present before Santa arrives. Santa can call or text when he's on his way so everyone is ready." },
  { title: "Designated Parking", text: "Create a specific, convenient parking spot near the entrance for a smooth and magical arrival." },
  { title: "Pets", text: "Not all pets are comfortable around strangers in elaborate suits. Keep pets in a separate room for their safety and to prevent stress or accidents." },
];

const Tips = () => {
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
                  <p className="text-foreground/80 leading-relaxed">{tip.text}</p>
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
