import { HelpCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const CLIENT_EMAIL = "info@northstarsanta.com";

const faqs = [
  {
    question: "I can't submit a booking request.",
    answer: "Make sure all required fields are filled out and that the selected date/time is available.",
  },
  {
    question: "Why can't I select a date?",
    answer: "Dates highlighted in light red are unavailable because Santa is already booked or blocked out.",
  },
  {
    question: "Why is a time crossed out?",
    answer: "That time is unavailable for the selected date. Please choose another available time.",
  },
  {
    question: "I submitted a testimonial. Why don't I see it?",
    answer: "Testimonials are reviewed before appearing publicly on the website.",
  },
  {
    question: "I submitted a photo. Why isn't it in the gallery?",
    answer: "Photos are reviewed before being added to the public gallery.",
  },
  {
    question: "How do I contact Santa directly?",
    answer: "You can contact North Star Santa directly through email for booking questions or special requests.",
    email: CLIENT_EMAIL,
  },
];

const FAQHelpPopup = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="hero"
          size="lg"
          aria-label="Open booking and website help"
          className="fixed bottom-5 right-5 z-40 h-12 rounded-full border border-gold/50 px-4 shadow-gold sm:bottom-6 sm:right-6"
        >
          <HelpCircle className="h-5 w-5" aria-hidden="true" />
          <span>Help</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border-gold/40 bg-background p-0 shadow-elegant sm:max-w-2xl">
        <div className="bg-gradient-banner px-6 py-5 text-primary-foreground sm:px-8">
          <DialogHeader className="text-left">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gold text-gold-foreground shadow-gold">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
            <DialogTitle className="font-display text-3xl text-gold">Need a Little Help?</DialogTitle>
            <DialogDescription className="text-primary-foreground/90">
              Quick answers for booking, testimonials, and gallery submissions.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-3 px-6 py-5 sm:px-8 sm:py-6">
          {faqs.map((item) => (
            <section
              key={item.question}
              className="rounded-lg border border-border bg-card p-4 shadow-card"
              aria-labelledby={`faq-${item.question.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`}
            >
              <h3
                id={`faq-${item.question.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`}
                className="font-display text-xl text-secondary"
              >
                {item.question}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                {item.answer}
                {"email" in item && item.email && (
                  <>
                    {" "}
                    <a
                      href={`mailto:${item.email}`}
                      className="font-semibold text-primary underline underline-offset-4 hover:text-secondary"
                    >
                      {item.email}
                    </a>
                  </>
                )}
              </p>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FAQHelpPopup;
