import { Link } from "react-router-dom";
import { logoImg } from "@/lib/localContent";

const Footer = () => {
  return (
    <footer className="mt-20 bg-secondary text-secondary-foreground">
      <div className="flex justify-center py-6 text-gold text-2xl tracking-[0.6em] select-none" aria-hidden>
        ❄ ❄ ❄
      </div>
      <div className="container pb-10 grid gap-8 md:grid-cols-3 items-start">
        <div>
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background/90 p-1 shadow-card ring-1 ring-gold/30">
              <img src={logoImg} alt="North Star Santa logo" className="h-full w-full rounded-full object-contain" />
            </span>
            <span className="font-display text-2xl font-bold text-gold">North Star Santa</span>
          </Link>
          <p className="mt-3 italic text-secondary-foreground/85 font-display">
            "Bringing Christmas Magic to Your Doorstep"
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 md:justify-center">
          <Link to="/" className="hover:text-gold transition-colors">Home</Link>
          <Link to="/testimonials" className="hover:text-gold transition-colors">Testimonials</Link>
          <Link to="/gallery" className="hover:text-gold transition-colors">Gallery</Link>
          <Link to="/services" className="hover:text-gold transition-colors">Services</Link>
          <Link to="/tips" className="hover:text-gold transition-colors">Helpful Hints</Link>
          <Link to="/book" className="hover:text-gold transition-colors">Book Santa</Link>
        </nav>
        <p className="text-sm text-secondary-foreground/75 md:text-right">
          © 2024 North Star Santa. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
