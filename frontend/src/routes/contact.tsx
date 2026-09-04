import { Clock, Instagram, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { BRAND_NAME } from "@/data/site";
import { useSite } from "@/context/SiteSettingsContext";
import { Seo } from "@/lib/seo";
import { ContactForm } from "@/components/sections/ContactForm";
import { cn } from "@/lib/utils";
import { ErrorState, TextSkeleton } from "@/components/ui-kit/AsyncStates";
import { PageHero } from "@/components/ui-kit/PageHero";
import { Reveal } from "@/components/ui-kit/Reveal";
import {
  ButtonAnchor,
  Container,
  Eyebrow,
  Section,
  SectionHeading,
} from "@/components/ui-kit/primitives";

/**
 * Every contact detail on this page is owned by the dashboard. None of it is
 * hardcoded any more, so each block waits for its value: a skeleton of the same
 * height while loading, and — because this is the page people arrive at
 * *specifically* to find a phone number — a visible error with a retry if the
 * request fails, rather than a page that quietly shows nothing.
 */
export function ContactPage() {
  const {
    site,
    phones,
    primaryPhone,
    hours,
    addressLine,
    addressCity,
    mapsLink,
    mapsEmbed,
    telLink,
    whatsappLink,
    loading,
    error,
    reload,
  } = useSite();

  const messageEnquiry = whatsappLink("Hello Madhuri Jewellers,");
  const visitEnquiry = whatsappLink("Hello Madhuri Jewellers, I'd like to book a visit.");

  return (
    <>
      <Seo
        title="Contact & Directions | Madhuri Jewellers, Old Neredmet, Secunderabad"
        description="Visit Madhuri Jewellers at Vinayak Nagar X Road, Old Neredmet, Malkajgiri, Secunderabad. Phone, WhatsApp, business hours, map and enquiry form."
        path="/contact"
      />
      <PageHero
        eyebrow="Come and see us"
        title="Contact & Directions"
        line="Vinayak Nagar X Road, Old Neredmet, Malkajgiri."
        intro="Open six days a week with parking directly outside. Call, message, or simply walk in — there is no appointment needed unless you are buying bridal."
        image="store"
        trail={[
          { label: "Home", path: "/" },
          { label: "Contact", path: "/contact" },
        ]}
      />

      <Section>
        <Container className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Details */}
          <div className="lg:col-span-5">
            <Eyebrow>Store details</Eyebrow>
            <h2 className="mt-4 font-display text-3xl leading-tight text-foreground sm:text-4xl">
              {site?.name ?? BRAND_NAME}
            </h2>

            {error ? (
              <ErrorState
                message="We could not load the store's contact details just now."
                onRetry={reload}
                className="mt-8"
              />
            ) : null}

            <ul className="mt-10 space-y-8 text-sm">
              <li className="flex gap-4">
                <MapPin aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                <div>
                  <p className="text-[0.62rem] uppercase tracking-[0.22em] text-muted-foreground">
                    Address
                  </p>
                  {addressLine ? (
                    <p className="mt-2 leading-relaxed text-foreground/85">
                      {addressLine}
                      <br />
                      {addressCity}
                    </p>
                  ) : (
                    <p className="mt-2 flex flex-col gap-1.5">
                      <TextSkeleton className="w-52" />
                      <TextSkeleton className="w-36" />
                    </p>
                  )}
                  {mapsLink ? (
                    <a
                      href={mapsLink}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-block text-[0.62rem] font-medium uppercase tracking-[0.22em] text-brand transition-colors hover:text-foreground"
                    >
                      Open in Google Maps →
                    </a>
                  ) : null}
                </div>
              </li>

              <li className="flex gap-4">
                <Phone aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                <div>
                  <p className="text-[0.62rem] uppercase tracking-[0.22em] text-muted-foreground">
                    Phone
                  </p>
                  <div className="mt-2 flex flex-col gap-1">
                    {phones.length > 0 ? (
                      phones.map((phone: string) => (
                        <a
                          key={phone}
                          href={telLink(phone)}
                          className="text-foreground/85 transition-colors hover:text-brand"
                        >
                          +91 {phone}
                        </a>
                      ))
                    ) : (
                      <TextSkeleton className="w-32" />
                    )}
                  </div>
                </div>
              </li>

              <li className="flex gap-4">
                <MessageCircle aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                <div>
                  <p className="text-[0.62rem] uppercase tracking-[0.22em] text-muted-foreground">
                    WhatsApp
                  </p>
                  {messageEnquiry ? (
                    <a
                      href={messageEnquiry}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block text-foreground/85 transition-colors hover:text-brand"
                    >
                      Message the counter directly
                    </a>
                  ) : (
                    <TextSkeleton className="mt-2 w-48" />
                  )}
                </div>
              </li>

              <li className="flex gap-4">
                <Mail aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                <div>
                  <p className="text-[0.62rem] uppercase tracking-[0.22em] text-muted-foreground">
                    Email
                  </p>
                  {site?.email ? (
                    <a
                      href={`mailto:${site.email}`}
                      className="mt-2 block text-foreground/85 transition-colors hover:text-brand"
                    >
                      {site.email}
                    </a>
                  ) : (
                    <TextSkeleton className="mt-2 w-44" />
                  )}
                </div>
              </li>

              <li className="flex gap-4">
                <Clock aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                <div className="w-full">
                  <p className="text-[0.62rem] uppercase tracking-[0.22em] text-muted-foreground">
                    Business hours
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {hours.length > 0
                      ? hours.map((row) => (
                          <li
                            key={row.days}
                            className="flex justify-between gap-6 text-foreground/85"
                          >
                            <span className="text-muted-foreground">{row.days}</span>
                            <span>{row.time}</span>
                          </li>
                        ))
                      : Array.from({ length: 2 }, (_, index) => (
                          <li key={index} className="flex justify-between gap-6">
                            <TextSkeleton className="w-28" />
                            <TextSkeleton className="w-24" />
                          </li>
                        ))}
                  </ul>
                </div>
              </li>

              <li className="flex gap-4">
                <Instagram aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                <div>
                  <p className="text-[0.62rem] uppercase tracking-[0.22em] text-muted-foreground">
                    Instagram
                  </p>
                  {site?.instagram ? (
                    <a
                      href={site.instagram}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block text-foreground/85 transition-colors hover:text-brand"
                    >
                      @madhuri_jewellers2024
                    </a>
                  ) : (
                    <TextSkeleton className="mt-2 w-40" />
                  )}
                </div>
              </li>
            </ul>

            <div className="mt-10 flex flex-wrap gap-3">
              {visitEnquiry ? (
                <ButtonAnchor href={visitEnquiry}>
                  <MessageCircle aria-hidden className="h-4 w-4" /> Book a visit
                </ButtonAnchor>
              ) : null}
              {primaryPhone ? (
                <ButtonAnchor href={telLink(primaryPhone)} variant="outline" external={false}>
                  <Phone aria-hidden className="h-4 w-4" /> Call now
                </ButtonAnchor>
              ) : null}
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-7">
            <ContactForm />
          </div>
        </Container>
      </Section>

      {/* Map */}
      <Section tone="surface" className="py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Getting here"
            title="Five minutes from Safilguda station"
            intro="On the main road at Vinayak Nagar X Road. Parking directly outside; the 16A and 17H bus routes both stop within a two-minute walk."
          />
          <Reveal className="mt-12 border border-brand/25">
            {mapsEmbed ? (
              <iframe
                title={`Map showing ${site?.name ?? BRAND_NAME}, Old Neredmet, Secunderabad`}
                src={mapsEmbed}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-[26rem] w-full grayscale-[0.4] contrast-[1.1]"
              />
            ) : (
              <span
                aria-hidden
                className={cn("block h-[26rem] w-full bg-border/30", loading && "animate-pulse")}
              />
            )}
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
