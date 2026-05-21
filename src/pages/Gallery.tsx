import { useEffect, useState, type FormEvent } from "react";
import Reveal from "@/components/Reveal";
import { ImageOff, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  getApprovedGalleryPhotos,
  type GalleryPhoto,
} from "@/lib/sanityQueries";
import { isSanityConfigured } from "@/lib/sanityClient";
import { localGalleryPhotos } from "@/lib/localContent";

const Gallery = () => {
  const [photos, setPhotos] = useState<GalleryPhoto[]>(localGalleryPhotos);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadPhotos = async () => {
      try {
        const photoRows = await getApprovedGalleryPhotos();
        setPhotos(photoRows.length > 0 ? [...photoRows, ...localGalleryPhotos] : localGalleryPhotos);
      } catch (error) {
        console.warn("Could not load Sanity gallery photos, using fallback.", error);
        toast({
          title: "Could not load latest photos",
          description: "Showing local gallery photos instead.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadPhotos();
  }, [toast]);

  return (
    <>
      <section className="bg-secondary text-secondary-foreground py-16 md:py-20 text-center">
        <div className="container">
          <p className="text-gold uppercase tracking-[0.3em] text-xs font-bold mb-3">Gallery</p>
          <h1 className="font-display text-4xl md:text-6xl text-gold">Santa Photos</h1>
          <p className="mt-4 text-secondary-foreground/85 max-w-xl mx-auto">
            Cheerful moments from North Star Santa visits and client memories.
          </p>
        </div>
      </section>

      <section className="container py-16 md:py-20">
        {loading ? (
          <p className="text-center text-muted-foreground">Loading gallery...</p>
        ) : photos.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo, i) => (
              <Reveal key={photo.id} delay={(i % 6) * 60}>
                <article className="h-full overflow-hidden rounded-lg border border-border bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-elegant">
                  <img
                    src={photo.imageUrl}
                    alt={photo.title || photo.caption || "North Star Santa gallery photo"}
                    className="aspect-[4/3] w-full object-cover"
                    style={{
                      objectFit: photo.imageFit || "cover",
                      objectPosition: photo.imagePosition || "center top",
                    }}
                  />
                  {(photo.title || photo.caption || photo.submittedBy) && (
                    <div className="space-y-1 p-4">
                      {photo.title && <h2 className="font-display text-xl text-secondary">{photo.title}</h2>}
                      {photo.caption && <p className="text-sm text-foreground/80">{photo.caption}</p>}
                      {photo.submittedBy && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Shared by {photo.submittedBy}</p>}
                    </div>
                  )}
                </article>
              </Reveal>
            ))}
          </div>
        ) : (
          <EmptyContent label={isSanityConfigured ? "No approved photos are published yet." : "Gallery photos will appear here soon."} />
        )}
      </section>

      <PhotoSubmissionForm />
    </>
  );
};

const PhotoSubmissionForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [caption, setCaption] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (photoFiles.length === 0) {
      toast({
        title: "Choose a photo",
        description: "Please add at least one image to submit.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      for (const file of photoFiles) {
        const imageDataUrl = await fileToDataUrl(file);
        const photoResponse = await fetch("/api/photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `${name || "Guest"} photo`,
            imageDataUrl,
            caption,
            submittedBy: name,
            submittedEmail: email,
          }),
        });

        console.log("[photos] API response status:", photoResponse.status, photoResponse.statusText);

        if (!photoResponse.ok) {
          const payload = await photoResponse.json().catch(() => null);
          console.log("[photos] API error response body:", payload);
          throw new Error(payload?.error || "Could not submit one of the photos.");
        }
      }

      setSubmitted(true);
    } catch (error) {
      toast({
        title: "Could not submit photo",
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
          <p className="text-gold uppercase tracking-[0.25em] text-xs font-bold mb-3">Share a Memory</p>
          <h2 className="font-display text-3xl md:text-4xl text-secondary">Submit a Photo</h2>
          <p className="mt-3 text-foreground/75">
            Client photos are reviewed before they appear publicly in the gallery.
          </p>
        </div>
        {submitted ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center shadow-card">
            <h3 className="font-display text-2xl text-secondary mb-2">Thank you!</h3>
            <p className="text-foreground/80">Your photo has been submitted for review.</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="bg-card border border-border rounded-lg p-6 md:p-8 shadow-card space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="g-name">Name (optional)</Label>
                <Input
                  id="g-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={120}
                />
              </div>
              <div>
                <Label htmlFor="g-email">Email (not published)</Label>
                <Input
                  id="g-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={160}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="g-caption">Caption (optional)</Label>
              <Textarea
                id="g-caption"
                rows={3}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={1000}
              />
            </div>
            <div>
              <Label htmlFor="g-photos">Photos (up to 3)</Label>
              <Input
                id="g-photos"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setPhotoFiles(Array.from(e.target.files ?? []).slice(0, 3))}
                required
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
                    Submit Photo
                  </span>
                )
              ) : "Photo Submissions Opening Soon"}
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

export default Gallery;
