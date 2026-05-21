import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logoImg } from "@/lib/localContent";

const links = [
  { to: "/", label: "Home" },
  { to: "/testimonials", label: "Testimonials" },
  { to: "/gallery", label: "Gallery" },
  { to: "/services", label: "Services" },
  { to: "/tips", label: "Helpful Hints" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all",
        scrolled
          ? "bg-background/95 backdrop-blur shadow-card border-b border-border"
          : "bg-background/90 backdrop-blur-md border-b border-border/40",
      )}
    >
      <div className="container flex h-16 items-center justify-between gap-3 md:h-20">
        <Link to="/" className="flex min-w-0 items-center gap-2 group">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center md:h-14 md:w-14">
            <img src={logoImg} alt="North Star Santa logo" className="h-full w-full object-contain drop-shadow-[0_2px_6px_hsl(0_0%_0%_/_0.28)]" />
          </span>
          <span className="truncate font-display text-lg font-bold text-gold tracking-wide drop-shadow-sm sm:text-xl md:text-2xl">
            North Star Santa
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-4 lg:gap-8">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                cn(
                  "text-sm font-semibold transition-colors hover:text-primary",
                  isActive ? "text-primary" : "text-foreground",
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Button asChild variant="hero" size="lg" className="pulse-gold">
            <Link to="/book">Book Santa</Link>
          </Button>
        </div>

        <button
          className="shrink-0 rounded-md p-2 text-foreground transition-colors hover:bg-muted md:hidden"
          aria-label="Toggle menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background/98 shadow-card md:hidden">
          <nav className="container flex flex-col py-4 gap-3">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "py-2 text-base font-semibold",
                    isActive ? "text-primary" : "text-foreground",
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
            <Button asChild variant="hero" className="mt-2">
              <Link to="/book">Book Santa</Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
