import { useEffect, useState, type MouseEvent } from "react";
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

  const scrollCurrentPageToTop = (to: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (location.pathname === to) {
      event.preventDefault();
      setOpen(false);
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300 ease-out",
        scrolled
          ? "border-b border-gold/45 bg-background/98 shadow-[0_8px_22px_hsl(0_0%_0%_/_0.12),0_1px_0_hsl(43_88%_62%_/_0.28)] backdrop-blur"
          : "border-b border-gold/45 bg-background/98 shadow-[0_10px_28px_hsl(0_0%_0%_/_0.1),0_1px_0_hsl(43_88%_62%_/_0.28)] backdrop-blur-md",
      )}
    >
      <div
        className={cn(
          "container flex items-center justify-between gap-3 transition-all duration-300 ease-out",
          scrolled ? "h-16 py-1 md:h-20 xl:h-20" : "h-24 py-2 md:h-28 xl:h-32",
        )}
      >
        <Link to="/" onClick={scrollCurrentPageToTop("/")} className="flex min-w-0 items-center gap-3 group md:gap-5">
          <span
            className={cn(
              "flex shrink-0 items-center justify-center transition-all duration-300 ease-out",
              scrolled ? "h-12 w-12 md:h-16 md:w-16 xl:h-[4.5rem] xl:w-[4.5rem]" : "h-16 w-16 md:h-24 md:w-24 xl:h-28 xl:w-28",
            )}
          >
            <img src={logoImg} alt="North Star Santa logo" className="h-full w-full object-contain drop-shadow-[0_3px_9px_hsl(0_0%_0%_/_0.32)]" />
          </span>
          <span
            className={cn(
              "truncate font-display font-bold text-gold tracking-wide drop-shadow-sm transition-all duration-300 ease-out",
              scrolled ? "text-lg sm:text-xl xl:text-2xl" : "text-xl sm:text-2xl xl:text-3xl",
            )}
          >
            North Star Santa
          </span>
        </Link>

        <nav className="hidden xl:flex items-center gap-7">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              onClick={scrollCurrentPageToTop(l.to)}
              className={({ isActive }) =>
                cn(
                  "text-sm font-semibold transition-colors hover:text-primary lg:text-[0.95rem]",
                  isActive ? "text-primary" : "text-foreground",
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden xl:flex items-center gap-3">
          <Button asChild variant="hero" size="lg" className="pulse-gold shadow-gold">
            <Link to="/book" onClick={scrollCurrentPageToTop("/book")}>Book Santa</Link>
          </Button>
        </div>

        <button
          className="shrink-0 rounded-md p-2 text-foreground transition-colors hover:bg-muted xl:hidden"
          aria-label="Toggle menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-gold/25 bg-background/98 shadow-card xl:hidden">
          <nav className="container flex flex-col py-4 gap-3">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                onClick={scrollCurrentPageToTop(l.to)}
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
              <Link to="/book" onClick={scrollCurrentPageToTop("/book")}>Book Santa</Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
