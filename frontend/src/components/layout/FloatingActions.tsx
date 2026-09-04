import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, MessageCircle, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { useSite } from "@/context/SiteSettingsContext";

export function FloatingActions() {
  const { primaryPhone, telLink, whatsappLink } = useSite();
  const [showTop, setShowTop] = useState(false);
  // No number, no button. These float over the page, so an empty one that did
  // nothing when tapped would be worse than none at all.
  const whatsapp = whatsappLink("Hello Madhuri Jewellers, I would like to enquire about a design.");

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 print:hidden">
      <AnimatePresence>
        {showTop ? (
          <motion.button
            key="top"
            type="button"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.25 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Back to top"
            className="flex h-11 w-11 items-center justify-center border border-brand/35 bg-background/85 text-brand backdrop-blur transition-colors hover:border-brand hover:bg-primary hover:text-primary-foreground"
          >
            <ArrowUp aria-hidden className="h-4 w-4" />
          </motion.button>
        ) : null}
      </AnimatePresence>

      {primaryPhone ? (
        <a
          href={telLink(primaryPhone)}
          aria-label={`Call the store on +91 ${primaryPhone}`}
          className="flex h-12 w-12 items-center justify-center border border-brand/35 bg-background/85 text-brand shadow-lift backdrop-blur transition-all duration-300 hover:scale-105 hover:bg-primary hover:text-primary-foreground"
        >
          <Phone aria-hidden className="h-5 w-5" />
        </a>
      ) : null}

      {whatsapp ? (
        <a
          href={whatsapp}
          target="_blank"
          rel="noreferrer"
          aria-label="Chat with Madhuri Jewellers on WhatsApp"
          className="group relative flex h-12 w-12 items-center justify-center bg-primary text-primary-foreground shadow-gold transition-transform duration-300 hover:scale-105"
        >
          <span aria-hidden className="absolute inset-0 animate-glow bg-primary/40 blur-md" />
          <MessageCircle aria-hidden className="relative h-5 w-5" />
        </a>
      ) : null}
    </div>
  );
}
