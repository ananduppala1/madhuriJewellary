import { BRAND_NAME } from "@/data/site";
import { useSite } from "@/context/SiteSettingsContext";
import { Seo } from "@/lib/seo";
import { LegalPage, type LegalSection } from "@/components/pages/LegalPage";

/**
 * The policy text itself is static legal copy and stays in the bundle. The one
 * paragraph that quotes an email address and a phone number is built from the
 * live settings instead, so a legal page can never tell a customer to write to
 * an address the shop has stopped using.
 */
const SECTIONS: LegalSection[] = [
  {
    heading: "What this website collects",
    paragraphs: [
      "This is a marketing website. It has no accounts, no logins, no shopping cart and no payment processing. There is no database behind it storing your details.",
      "The enquiry form on the contact page does not send anything to a server. It formats what you type into a WhatsApp message and opens it on your own device. Nothing is transmitted unless you choose to press send in WhatsApp.",
    ],
  },
  {
    heading: "Information you share with us directly",
    paragraphs: [
      "When you call, message or visit the store, you may share your name, phone number, email address and details about what you are looking for. We use that only to respond to your enquiry and to serve you at the counter.",
    ],
    bullets: [
      "We do not sell, rent or share your contact details with third parties.",
      "We do not add you to marketing lists without you asking.",
      "Purchase records are kept as required under Indian tax and hallmarking regulations.",
    ],
  },
  {
    heading: "Third-party services on this site",
    paragraphs: [
      "Two external services are embedded here. Google Maps loads the map on the contact and footer sections; Google Fonts serves the typefaces. Both may receive your IP address and standard browser information as part of loading, governed by Google's own privacy policy.",
      "WhatsApp links open in WhatsApp itself. Anything you send there is handled under WhatsApp's privacy policy, not ours.",
    ],
  },
  {
    heading: "Cookies and tracking",
    paragraphs: [
      "This website sets no advertising or analytics cookies of its own. Embedded Google services may set their own cookies when you interact with the map.",
    ],
  },
  {
    heading: "Children",
    paragraphs: [
      "This website is intended for adults making jewellery enquiries. We do not knowingly collect information from children.",
    ],
  },
  {
    heading: "Changes to this policy",
    paragraphs: [
      "If we change how this website works — for example by adding analytics — we will update this page and change the date at the top before the change goes live.",
    ],
  },
];

/** Built at render time so the contact line reflects the dashboard. */
function contactSection(email: string | null, phone: string | null): LegalSection {
  const channels = [email ? `write to ${email}` : null, phone ? `call +91 ${phone}` : null]
    .filter(Boolean)
    .join(", ");

  return {
    heading: "Contact us about privacy",
    paragraphs: [
      channels
        ? `To reach us, ${channels}, or speak to us at the counter on Vinayak Nagar X Road, Old Neredmet, Malkajgiri, Secunderabad. We will respond to any reasonable request about your information.`
        : "Speak to us at the counter on Vinayak Nagar X Road, Old Neredmet, Malkajgiri, Secunderabad, or use the details on our contact page. We will respond to any reasonable request about your information.",
    ],
  };
}

export function PrivacyPage() {
  const { site, primaryPhone } = useSite();
  const sections = [...SECTIONS, contactSection(site?.email ?? null, primaryPhone)];

  return (
    <>
      <Seo
        title={`Privacy Policy | ${BRAND_NAME} Secunderabad`}
        description="How Madhuri Jewellers handles the information you share through this website — what we collect, what we do not, and how to reach us about it."
        path="/privacy-policy"
      />

      <LegalPage
        eyebrow="Legal"
        title="Privacy Policy"
        updated="1 August 2026"
        image="antique"
        path="/privacy-policy"
        intro="A short policy, because this website does very little with your data. Here is exactly what happens to anything you type or share."
        sections={sections}
      />
    </>
  );
}
