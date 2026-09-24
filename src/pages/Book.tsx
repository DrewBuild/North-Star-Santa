import { Button } from "@/components/ui/button";

const Book = () => (
  <div className="w-full flex flex-col items-center px-4 py-8">
    <iframe
      src="https://app.prosantasolutions.com/inquiry/jcAdDCKjkBX2OSJUBYQzyxxZ3Mx1"
      className="w-full max-w-[600px] border-0"
      height="650"
      title="Santa Inquiry Form"
    />
    <div className="mt-8 text-center">
      <p className="mb-3 font-display text-lg font-medium text-secondary">
        Or Call Santa's Booking Agent
      </p>
      <Button asChild variant="secondary" size="xl" className="px-6 text-xl font-semibold shadow-card">
        <a href="tel:7436261773">(743) 626-1773</a>
      </Button>
    </div>
  </div>
);

export default Book;
