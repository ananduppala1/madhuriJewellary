import { AnimatePresence, motion } from "framer-motion";
import { Link, Outlet, ScrollRestoration, useNavigation } from "react-router-dom";

import { SiteSettingsProvider, useSite } from "@/context/SiteSettingsContext";
import { localBusinessSchema, organizationSchema, websiteSchema } from "@/lib/seo";
import { Footer } from "@/components/layout/Footer";
import { FloatingActions } from "@/components/layout/FloatingActions";
import { Header } from "@/components/layout/Header";
import { LogoMark } from "@/components/ui-kit/Logo";
import { AssayDivider, ButtonLink, Eyebrow, JsonLd } from "@/components/ui-kit/primitives";
import { Toaster } from "@/components/ui/sonner";

export function RootLayout() {
  return (
    <SiteSettingsProvider>
      <RootShell />
    </SiteSettingsProvider>
  );
}

/**
 * Split out so the layout itself can read the live site settings the provider
 * above supplies — schema.org markup then reflects whatever the shop last saved
 * in the dashboard.
 */
function RootShell() {
  const { site } = useSite();

  return (
    <>
      {/* Structured data describes the business, so it is emitted only once the
          real business details have arrived. Publishing schema.org markup built
          from placeholder contact details would feed a search engine something
          the shop never said. */}
      {site ? (
        <>
          <JsonLd data={organizationSchema(site)} />
          <JsonLd data={localBusinessSchema(site)} />
        </>
      ) : null}
      <JsonLd data={websiteSchema} />

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-primary focus:px-5 focus:py-3 focus:text-[0.7rem] focus:font-medium focus:uppercase focus:tracking-[0.2em] focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <div className="flex min-h-screen flex-col">
        <Header />
        <main id="main" className="flex-1">
          {/* Nested routes render here — removing <Outlet /> breaks every child route. */}
          <Outlet />
        </main>
        <Footer />
      </div>

      <FloatingActions />
      <RouteProgress />
      <Toaster position="top-center" theme="light" />
      <ScrollRestoration />
    </>
  );
}

/** Loading animation — a gold hairline that fills while a route resolves. */
function RouteProgress() {
  const isLoading = useNavigation().state !== "idle";

  return (
    <AnimatePresence>
      {isLoading ? (
        <motion.div
          key="progress"
          role="status"
          aria-label="Loading page"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-x-0 top-0 z-[80] h-0.5 overflow-hidden"
        >
          <motion.span
            className="block h-full bg-[var(--gradient-gold)]"
            initial={{ width: "0%" }}
            animate={{ width: ["0%", "72%", "92%"] }}
            transition={{ duration: 1.4, ease: "easeOut" }}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function NotFoundPage() {
  return (
    <div className="relative flex min-h-[76vh] items-center justify-center overflow-hidden px-5 py-24">
      <span aria-hidden className="absolute inset-0 vignette-top" />
      <div className="relative flex max-w-xl flex-col items-center text-center">
        <LogoMark className="h-14 w-14 animate-glow" />
        <p className="mt-8 font-display text-[5.5rem] leading-none text-gradient-gold sm:text-[8rem]">
          404
        </p>
        <Eyebrow className="mt-2">Nothing in this tray</Eyebrow>
        <h1 className="mt-5 font-display text-3xl text-foreground sm:text-4xl">
          This page isn’t in the showroom
        </h1>
        <AssayDivider className="my-7 w-full max-w-xs" />
        <p className="text-sm leading-relaxed text-muted-foreground">
          The link may be old, or the collection may have been renamed. Start again from the home
          page, or tell us what you were looking for and we will point you at it.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <ButtonLink to="/">Back to home</ButtonLink>
          <ButtonLink to="/contact" variant="outline">
            Contact the store
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

/**
 * The router's error boundary. It can render outside the settings provider, so
 * it cannot reach for a phone number — and must not print a hardcoded one. It
 * points at the contact page instead, which has the live details.
 */
export function ErrorPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-5 py-24">
      <div className="max-w-md text-center">
        <Eyebrow>Something went wrong</Eyebrow>
        <h1 className="mt-4 font-display text-3xl text-foreground">This page didn’t load</h1>
        <AssayDivider className="my-6 w-full" />
        <p className="text-sm leading-relaxed text-muted-foreground">
          Refresh to try again. If it keeps happening, the contact page has the store's current
          phone number and WhatsApp.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center bg-primary px-7 py-3.5 text-[0.68rem] font-medium uppercase tracking-[0.24em] text-primary-foreground transition-colors hover:bg-brand"
          >
            Try again
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center border border-brand/40 px-7 py-3.5 text-[0.68rem] font-medium uppercase tracking-[0.24em] text-foreground transition-colors hover:border-brand hover:bg-primary hover:text-primary-foreground"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
