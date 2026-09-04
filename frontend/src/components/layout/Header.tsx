import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, MapPin, Menu, MessageCircle, Phone, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getProducts } from "@/api";
import { megaMenu, primaryNav } from "@/data/site";
import { useSite } from "@/context/SiteSettingsContext";
import { useCollections } from "@/hooks/useCatalogue";
import { cn } from "@/lib/utils";
import { Wordmark } from "@/components/ui-kit/Logo";
import { RateBar } from "@/components/layout/RateBar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function Header() {
  const { primaryPhone, addressLine, telLink, whatsappLink, loading } = useSite();
  const whatsapp = whatsappLink("Hello Madhuri Jewellers, I would like to enquire about a design.");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = useLocation().pathname;

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setMegaOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setSearchOpen(false);
      setMegaOpen(false);
      setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <RateBar />

      <header
        className={cn(
          "sticky top-0 z-50 border-b transition-all duration-500",
          scrolled ? "border-border glass-panel shadow-soft" : "border-border/60 bg-background",
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5">
          <Link to="/" aria-label="Madhuri Jewellers — home">
            <Wordmark compact={scrolled} />
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-8 xl:flex">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                cn(
                  "nav-link text-[0.68rem] font-medium uppercase tracking-[0.2em] transition-colors hover:text-brand",
                  isActive ? "text-brand" : "text-muted-foreground",
                )
              }
            >
              Home
            </NavLink>

            <div
              className="relative"
              onMouseEnter={() => setMegaOpen(true)}
              onMouseLeave={() => setMegaOpen(false)}
            >
              <button
                type="button"
                aria-expanded={megaOpen}
                aria-haspopup="true"
                onClick={() => setMegaOpen((v) => !v)}
                className={cn(
                  "flex items-center gap-1.5 text-[0.68rem] font-medium uppercase tracking-[0.2em] transition-colors",
                  megaOpen ? "text-brand" : "text-muted-foreground hover:text-brand",
                )}
              >
                Collections
                <ChevronDown
                  aria-hidden
                  className={cn(
                    "h-3 w-3 transition-transform duration-300",
                    megaOpen && "rotate-180",
                  )}
                />
              </button>
              <AnimatePresence>{megaOpen ? <MegaMenu /> : null}</AnimatePresence>
            </div>

            {primaryNav
              .filter((item) => item.to !== "/")
              .map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "text-[0.68rem] font-medium uppercase tracking-[0.2em] transition-colors hover:text-brand",
                      isActive ? "text-brand" : "text-muted-foreground",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
          </nav>

          <div className="flex items-center gap-2">
            <IconButton
              label="Search the collections"
              onClick={() => setSearchOpen(true)}
              className="hidden sm:inline-flex"
            >
              <Search aria-hidden className="h-4 w-4" />
            </IconButton>

            {/* The number comes from the dashboard. While it is loading the
                button keeps its space so the header does not shift; if the API
                is unreachable it is left out rather than guessed at. */}
            {primaryPhone ? (
              <a
                href={telLink(primaryPhone)}
                aria-label={`Call Madhuri Jewellers on +91 ${primaryPhone}`}
                className="hidden h-10 w-10 items-center justify-center border border-brand/25 text-muted-foreground transition-all duration-300 hover:border-brand hover:text-brand sm:inline-flex"
              >
                <Phone aria-hidden className="h-4 w-4" />
              </a>
            ) : loading ? (
              <span
                aria-hidden
                className="hidden h-10 w-10 animate-pulse border border-brand/15 bg-border/40 sm:inline-flex"
              />
            ) : null}

            {whatsapp ? (
              <a
                href={whatsapp}
                target="_blank"
                rel="noreferrer"
                className="hidden bg-primary px-5 py-3 text-[0.64rem] font-medium uppercase tracking-[0.22em] text-primary-foreground transition-colors hover:bg-brand lg:inline-flex"
              >
                WhatsApp Us
              </a>
            ) : loading ? (
              <span
                aria-hidden
                className="hidden h-[2.6rem] w-[8.4rem] animate-pulse bg-border/40 lg:inline-flex"
              />
            ) : null}

            <IconButton
              label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((v) => !v)}
              className="xl:hidden"
              expanded={menuOpen}
            >
              {menuOpen ? (
                <X aria-hidden className="h-4 w-4" />
              ) : (
                <Menu aria-hidden className="h-4 w-4" />
              )}
            </IconButton>
          </div>
        </div>

        <AnimatePresence>{menuOpen ? <MobileMenu /> : null}</AnimatePresence>
      </header>

      <AnimatePresence>
        {searchOpen ? <SearchOverlay onClose={() => setSearchOpen(false)} /> : null}
      </AnimatePresence>
    </>
  );
}

function IconButton({
  children,
  label,
  onClick,
  className,
  expanded,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
  expanded?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      {...(expanded === undefined ? {} : { "aria-expanded": expanded })}
      onClick={onClick}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center border border-brand/25 text-muted-foreground transition-all duration-300 hover:border-brand hover:text-brand",
        className,
      )}
    >
      {children}
    </button>
  );
}

function MegaMenu() {
  const { addressLine } = useSite();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="absolute left-1/2 top-full z-50 w-[min(64rem,92vw)] -translate-x-1/2 pt-5"
    >
      <div className="glass-panel shadow-lift">
        <div className="grid gap-8 p-8 md:grid-cols-4">
          {megaMenu.map((column) => (
            <div key={column.title}>
              <p className="eyebrow">{column.title}</p>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <NavLink
                      to={link.to}
                      className={({ isActive }) =>
                        cn("group/link block transition-colors", isActive && "text-brand")
                      }
                    >
                      <span className="block text-sm text-foreground transition-colors group-hover/link:text-brand">
                        {link.label}
                      </span>
                      {link.note ? (
                        <span className="mt-0.5 block text-[0.68rem] text-muted-foreground">
                          {link.note}
                        </span>
                      ) : null}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-8 py-4">
          {addressLine ? (
            <p className="flex items-center gap-2 text-[0.68rem] text-muted-foreground">
              <MapPin aria-hidden className="h-3.5 w-3.5 text-brand" />
              {addressLine}
            </p>
          ) : (
            <span aria-hidden className="h-3 w-56 animate-pulse bg-border/50" />
          )}
          <Link
            to="/contact"
            className="text-[0.64rem] font-medium uppercase tracking-[0.22em] text-brand transition-colors hover:text-foreground"
          >
            Book a bridal appointment →
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function MobileMenu() {
  const { site, primaryPhone, addressLine, telLink, whatsappLink } = useSite();
  const whatsapp = whatsappLink("Hello Madhuri Jewellers, I would like to enquire about a design.");
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
      animate={reduced ? { opacity: 1 } : { clipPath: "inset(0 0 0% 0)" }}
      exit={reduced ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-x-0 top-full max-h-[calc(100dvh-4.5rem)] overflow-y-auto border-t border-border bg-background shadow-lift xl:hidden"
    >
      <nav aria-label="Mobile" className="px-5 pb-10 pt-6">
        <ul className="space-y-1">
          {primaryNav.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "block border-b border-border/60 py-3.5 font-display text-xl transition-colors hover:text-brand",
                    isActive ? "text-brand" : "text-foreground",
                  )
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <Accordion type="multiple" className="mt-6">
          {megaMenu.map((column) => (
            <AccordionItem key={column.title} value={column.title} className="border-border/60">
              <AccordionTrigger className="py-4 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-brand hover:no-underline">
                {column.title}
              </AccordionTrigger>
              <AccordionContent>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.to}>
                      <NavLink
                        to={link.to}
                        className={({ isActive }) =>
                          cn(
                            "block py-1 text-sm transition-colors hover:text-brand",
                            isActive ? "text-brand" : "text-muted-foreground",
                          )
                        }
                      >
                        {link.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-10 flex flex-col gap-3">
          {whatsapp ? (
            <a
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 bg-primary px-5 py-3.5 text-[0.68rem] font-medium uppercase tracking-[0.22em] text-primary-foreground"
            >
              <MessageCircle aria-hidden className="h-4 w-4" /> WhatsApp Us
            </a>
          ) : null}
          {primaryPhone ? (
            <a
              href={telLink(primaryPhone)}
              className="flex items-center justify-center gap-2 border border-brand/40 px-5 py-3.5 text-[0.68rem] font-medium uppercase tracking-[0.22em] text-foreground"
            >
              <Phone aria-hidden className="h-4 w-4" /> +91 {primaryPhone}
            </a>
          ) : null}
          {addressLine ? (
            <p className="flex items-start gap-2 pt-3 text-xs leading-relaxed text-muted-foreground">
              <MapPin aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
              {[addressLine, site?.address.city].filter(Boolean).join(", ")}
            </p>
          ) : null}
        </div>
      </nav>
    </motion.div>
  );
}

/** Searches collections in memory and products through the API. */
type SearchEntry = { label: string; sub: string; to: string };

function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");

  // Collections come from the API; products are searched server-side so the
  // overlay never has to hold the whole catalogue in the bundle.
  const { data: collections } = useCollections();
  const [products, setProducts] = useState<SearchEntry[]>([]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setProducts([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      getProducts({ search: trimmed, limit: 8 }, { signal: controller.signal })
        .then((results) =>
          setProducts(
            results.map((product) => ({
              label: product.name,
              sub: product.collection?.name ?? "Madhuri Jewellers",
              to: `/product/${product.slug}`,
            })),
          ),
        )
        .catch(() => setProducts([]));
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  const index = useMemo<SearchEntry[]>(
    () =>
      (collections ?? []).map((collection) => ({
        label: collection.name,
        sub: collection.eyebrow,
        to: collection.path,
      })),
    [collections],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return index.slice(0, 8);

    const matchedCollections = index.filter((entry) =>
      `${entry.label} ${entry.sub}`.toLowerCase().includes(q),
    );

    return [...matchedCollections, ...products].slice(0, 10);
  }, [index, products, query]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[70] bg-background/92 backdrop-blur-lg"
      role="dialog"
      aria-modal="true"
      aria-label="Search the collections"
    >
      <div className="mx-auto max-w-2xl px-5 pt-24">
        <div className="flex items-center gap-3 border-b border-brand/30 pb-4">
          <Search aria-hidden className="h-5 w-5 text-brand" />
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search jhumkas, haaram, kadas…"
            aria-label="Search the collections"
            className="w-full bg-transparent font-display text-2xl text-foreground outline-none placeholder:text-foreground/25"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="text-muted-foreground transition-colors hover:text-brand"
          >
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>

        <ul className="mt-6 max-h-[60vh] space-y-1 overflow-y-auto">
          {results.length === 0 ? (
            <li className="py-6 text-sm text-muted-foreground">
              Nothing matches that yet. Try “jhumka”, “haaram”, “kada” — or ask us on WhatsApp and
              we will send photographs.
            </li>
          ) : (
            results.map((entry) => (
              <li key={`${entry.to}-${entry.label}`}>
                <Link
                  to={entry.to}
                  onClick={onClose}
                  className="flex items-baseline justify-between gap-4 border-b border-border/50 py-3 transition-colors hover:text-brand"
                >
                  <span className="text-base text-foreground">{entry.label}</span>
                  <span className="shrink-0 text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">
                    {entry.sub}
                  </span>
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
    </motion.div>
  );
}
