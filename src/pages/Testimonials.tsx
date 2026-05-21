import { useEffect, useState, type FormEvent } from "react";
import Reveal from "@/components/Reveal";
import { ImageOff, ImagePlus, Quote, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  getApprovedGalleryPhotos,
  getApprovedTestimonials,
  isSanityConfigured,
  type GalleryPhoto,
  type Testimonial,
} from "@/lib/sanity";
import { localGalleryPhotos, realTestimonials } from "@/lib/localContent";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const eventTypes = [
  "Home Visit", "Corporate Party", "School Event", "Hospital Visit",
  "Community Event", "HOA / Neighborhood Event", "Other",
];

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadPageData = async () => {
      try {
        const [testimonialRows, photoRows] = await Promise.all([
          getApprovedTestimonials(),
          getApprovedGalleryPhotos(),
        ]);

        const extraTestimonials = testimonialRows.filter(
          (testimonial) => !realTestimonials.some((local) => local.name === testimonial.name),
        );

        setTestimonials([...realTestimonials, ...extraTestimonials]);
        setPhotos(photoRows.length > 0 ? photoRows : localGalleryPhotos);
      } catch (error) {
        toast({
          title: "Could not load testimonials",
          description: error instanceof Error ? error.message : "Check the Sanity connection.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadPageData();
  }, [toast]);

  return (
    <>
      <section className="bg-secondary text-secondary-foreground py-16 md:py-20 text-center">
        <div className="container">
          <p className="text-gold uppercase tracking-[0.3em] text-xs font-bold mb-3">Kind Words & Memories</p>
          <h1 className="font-display text-4xl md:text-6xl text-gold">Testimonials & Gallery</h1>
          <p className="mt-4 text-secondary-foreground/85 max-w-xl mx-auto">
            A magazine of cheerful moments and heartfelt notes from families and clients.
          </p>
        </div>
      </section>

      <section className="container py-16 md:py-20">
        {loading ? (
          <p className="text-center text-muted-foreground">Loading testimonials...</p>
        ) : testimonials.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {testimonials.map((testimonial, i) => (
              <Reveal key={testimonial.id} delay={(i % 4) * 80}>
                <article className="h-full bg-card border border-border rounded-lg p-8 shadow-card hover:shadow-elegant hover:-translate-y-1 transition-all relative">
                  <Quote className="absolute -top-3 left-6 h-10 w-10 text-gold fill-gold" />
                  <p className="font-display italic text-xl md:text-2xl text-foreground/90 leading-relaxed mt-4">
                    "{testimonial.reviewText}"
                  </p>
                  <p className="mt-6 text-sm font-semibold text-secondary">
                    - {testimonial.name}
                    {testimonial.organization && <span className="text-muted-foreground font-normal">, {testimonial.organization}</span>}
                    {testimonial.location && <span className="text-muted-foreground font-normal">, {testimonial.location}</span>}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        ) : (
            <EmptyContent label={isSanityConfigured ? "No approved testimonials are published yet." : "Testimonials will appear here soon."} />
        )}
      </section>

      <section className="bg-muted/60 py-16 md:py-20">
        <div className="container">
          <div className="text-center mb-10">
            <p className="text-gold uppercase tracking-[0.25em] text-xs font-bold mb-3">Gallery</p>
            <h2 className="font-display text-3xl md:text-4xl text-secondary">Santa Photos</h2>
          </div>
          {photos.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-3">
              {photos.map((photo) => (
                <article key={photo.id} className="bg-card border border-border rounded-lg overflow-hidden shadow-card">
                  <img
                    src={photo.imageUrl}
                    alt={photo.title || photo.caption || "North Star Santa gallery photo"}
                    className="aspect-[4/3] w-full object-cover"
                    style={{ objectPosition: photo.imagePosition || "center top" }}
                  />
                  {photo.caption && <p className="p-4 text-sm font-semibold text-secondary">{photo.caption}</p>}
                </article>
              ))}
            </div>
          ) : (
            <EmptyContent label={isSanityConfigured ? "No approved photos are published yet." : "Gallery photos will appear here soon."} />
          )}
        </div>
      </section>

      <ShareForm />
    </>
  );
};

const ShareForm = () => {
  const [quote, setQuote] = useState("");
  const [author, setAuthor] = useState("");
  const [eventType, setEventType] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const testimonialResponse = await fetch("/api/submit-testimonial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: author,
          email,
          reviewText: quote,
          organization: eventType,
          location,
        }),
      });

      if (!testimonialResponse.ok) {
        const payload = await testimonialResponse.json().catch(() => null);
        throw new Error(payload?.error || "Could not submit testimonial.");
      }

      for (const file of photoFiles) {
        const imageDataUrl = await fileToDataUrl(file);
        const photoResponse = await fetch("/api/submit-gallery-photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `${author || "Guest"} photo`,
            imageDataUrl,
            caption: quote.slice(0, 220),
            submittedBy: author,
            submittedEmail: email,
          }),
        });

        if (!photoResponse.ok) {
          const payload = await photoResponse.json().catch(() => null);
          throw new Error(payload?.error || "Could not submit one of the photos.");
        }
      }

      setSubmitted(true);
    } catch (error) {
      toast({
        title: "Could not submit testimonial",
        description: error instanceof Error ? error.message : "Check the Sanity connection.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-muted/60 py-16 md:py-20">
      <div className="container max-w-2xl">
        <div className="text-center mb-8">
          <p className="text-gold uppercase tracking-[0.25em] text-xs font-bold mb-3">Share Your Experience</p>
          <h2 className="font-display text-3xl md:text-4xl text-secondary">Leave a Testimonial</h2>
          <p className="mt-3 text-foreground/75">
            Had a magical visit? We'd love to hear about it. Submissions are reviewed before being published.
          </p>
        </div>
        {submitted ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center shadow-card">
            <h3 className="font-display text-2xl text-secondary mb-2">Thank you! 🎄</h3>
            <p className="text-foreground/80">Your testimonial has been submitted and will appear here once approved.</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="bg-card border border-border rounded-lg p-6 md:p-8 shadow-card space-y-4">
            <div>
              <Label htmlFor="t-quote">Your testimonial *</Label>
              <Textarea id="t-quote" rows={4} value={quote} onChange={(e) => setQuote(e.target.value)} maxLength={1000} required />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="t-name">Name to display *</Label>
                <Input
                  id="t-name"
                  placeholder="Family, company, your name, or Anonymous"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  maxLength={100}
                  required
                />
              </div>
              <div>
                <Label htmlFor="t-email">Email (not published)</Label>
                <Input
                  id="t-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={160}
                />
              </div>
              <div>
                <Label htmlFor="t-event">Event type (optional)</Label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger id="t-event"><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {eventTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="t-location">Location (optional)</Label>
                <Input
                  id="t-location"
                  placeholder="City, state"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  maxLength={160}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="t-photos">Photos (optional, up to 3)</Label>
              <Input
                id="t-photos"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setPhotoFiles(Array.from(e.target.files ?? []).slice(0, 3))}
              />
              {photoFiles.length > 0 && (
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {photoFiles.map((file) => (
                    <div key={`${file.name}-${file.size}`} className="flex items-center justify-between rounded-md border border-border bg-muted/60 px-3 py-2 text-sm">
                      <span className="truncate">{file.name}</span>
                      <button
                        type="button"
                        className="ml-2 text-muted-foreground hover:text-primary"
                        onClick={() => setPhotoFiles((files) => files.filter((item) => item !== file))}
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={saving || !isSanityConfigured}>
              {isSanityConfigured ? (
                saving ? "Submitting..." : (
                  <span className="inline-flex items-center gap-2">
                    <ImagePlus className="h-4 w-4" />
                    Submit Testimonial
                  </span>
                )
              ) : "Submissions Opening Soon"}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
};

const EmptyContent = ({ label }: { label: string }) => (
  <div className="bg-card border border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
    <ImageOff className="mx-auto mb-3 h-8 w-8 text-gold" />
    {label}
  </div>
);

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error("Each photo must be 5MB or smaller."));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read photo file."));
    reader.readAsDataURL(file);
  });

export default Testimonials;
