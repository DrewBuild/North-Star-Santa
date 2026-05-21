import { useEffect, useState } from "react";
import {
  getSanityReadDebugSnapshot,
  type SanityReadDebugSnapshot,
} from "@/lib/sanityQueries";
import { sanityDataset, sanityProjectId } from "@/lib/sanityClient";

const SanityReadDebugPanel = () => {
  const [snapshot, setSnapshot] = useState<SanityReadDebugSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const loadSnapshot = async () => {
      try {
        const nextSnapshot = await getSanityReadDebugSnapshot();
        setSnapshot(nextSnapshot);
        setError(null);
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : String(caught);
        console.log("[sanity:debug-panel] error", caught);
        setError(message);
      }
    };

    loadSnapshot();
  }, []);

  if (!import.meta.env.DEV) return null;

  return (
    <aside className="fixed bottom-20 left-4 z-50 max-h-[45vh] w-[min(420px,calc(100vw-2rem))] overflow-auto rounded-lg border border-gold/50 bg-background/95 p-4 text-xs text-foreground shadow-elegant backdrop-blur">
      <h2 className="font-display text-lg text-secondary">Sanity Read Debug</h2>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <dt className="font-semibold text-muted-foreground">Project</dt>
        <dd>{sanityProjectId}</dd>
        <dt className="font-semibold text-muted-foreground">Dataset</dt>
        <dd>{sanityDataset}</dd>
        <dt className="font-semibold text-muted-foreground">Testimonials</dt>
        <dd>{snapshot?.testimonials.length ?? "loading"}</dd>
        <dt className="font-semibold text-muted-foreground">Gallery</dt>
        <dd>{snapshot?.galleryPhotos.length ?? "loading"}</dd>
      </dl>
      {error && (
        <div className="mt-3 rounded-md border border-primary/30 bg-primary/10 p-2 font-semibold text-primary">
          {error}
        </div>
      )}
      {snapshot && (
        <div className="mt-3 space-y-3">
          <DebugBlock label="Testimonial Query" value={snapshot.testimonialQuery} />
          <DebugBlock label="Gallery Query" value={snapshot.galleryQuery} />
          <DebugBlock label="Raw Approved Testimonials" value={snapshot.testimonials} />
          <DebugBlock label="Raw Approved Gallery" value={snapshot.galleryPhotos} />
        </div>
      )}
    </aside>
  );
};

const DebugBlock = ({ label, value }: { label: string; value: unknown }) => (
  <section>
    <h3 className="mb-1 font-semibold text-secondary">{label}</h3>
    <pre className="max-h-36 overflow-auto rounded-md bg-muted p-2 text-[11px] leading-relaxed">
      {typeof value === "string" ? value.trim() : JSON.stringify(value, null, 2)}
    </pre>
  </section>
);

export default SanityReadDebugPanel;
