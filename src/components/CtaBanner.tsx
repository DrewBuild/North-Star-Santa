import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Snow from "./Snow";

const CtaBanner = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-banner text-primary-foreground">
      <Snow count={12} />
      <div className="relative container py-14 md:py-20 text-center">
        <p className="font-display italic text-2xl md:text-4xl">
          Ready to make this Christmas unforgettable?
        </p>
        <div className="mt-8">
          <Button asChild variant="gold" size="xl">
            <Link to="/book">Book Santa</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CtaBanner;
