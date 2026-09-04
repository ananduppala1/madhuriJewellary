import { BRAND_NAME } from "@/data/site";
import { useSite } from "@/context/SiteSettingsContext";
import { Seo } from "@/lib/seo";
import { LegalPage, type LegalSection } from "@/components/pages/LegalPage";

/**
 * Static legal copy, except for the publisher's legal name and the contact
 * line — both of which the shop owns and can change in the dashboard.
 */
function aboutSection(legalName: string): LegalSection {
  return {
    heading: "About this website",
    paragraphs: [
      `This website is published by ${legalName}, Vinayak Nagar X Road, Old Neredmet, Malkajgiri, Secunderabad, Telangana. It exists to show what we make and to help you find and contact the store.`,
      "It is not an online shop. You cannot buy, reserve or pay for anything here. Every purchase happens in person at the counter.",
    ],
  };
}

const SECTIONS: LegalSection[] = [
  {
    heading: "Designs, weights and availability",
    paragraphs: [
      "Weight ranges, design counts and descriptions describe what we typically hold in store. Stock moves daily — a specific piece shown here may already have been sold, and any item can usually be made to order instead.",
      "Photographs are representative. Gold colour, matte or mirror finish, and stone tone all read differently on a screen than under showroom light. Please judge a piece in person before deciding.",
    ],
  },
  {
    heading: "Pricing",
    paragraphs: [
      "No prices are published on this website. Jewellery is priced at the time of purchase from the prevailing gold or silver rate, the net weight, the applicable making charge and GST.",
      "The rate displayed on the board in the showroom at the moment of billing is the rate applied. Any quotation given verbally or by message is indicative until it is written on a printed estimate.",
    ],
  },
  {
    heading: "Hallmarking and certification",
    paragraphs: [
      "All gold jewellery sold by us carries a BIS hallmark with purity grade and a six-digit HUID, which you are welcome to verify in the BIS Care app before payment.",
      "Diamond certification, where offered, is issued by IGI or GIA. We are not the certifying authority and any grading dispute is resolved with the issuing laboratory.",
    ],
  },
  {
    heading: "Offers and schemes",
    paragraphs: [
      "Offers described on this website are subject to the terms shown alongside them and may be withdrawn at any time. The savings scheme is governed by the separate written terms handed to you at enrolment, which take precedence over anything on this page.",
    ],
  },
  {
    heading: "Intellectual property",
    paragraphs: [
      `The name ${BRAND_NAME}, the monogram, the photographs, the design of this website and its written content belong to us. Please do not reproduce them commercially without written permission.`,
    ],
  },
  {
    heading: "External links",
    paragraphs: [
      "This site links to Google Maps, WhatsApp and our social media profiles. We do not control those services and are not responsible for their content or their handling of your data.",
    ],
  },
  {
    heading: "Limitation of liability",
    paragraphs: [
      "We take care to keep this website accurate, but it is provided as it is. We are not liable for any loss arising from reliance on information here that has since changed. For anything that matters to a purchase decision, please confirm with us directly.",
    ],
  },
  {
    heading: "Governing law",
    paragraphs: [
      "These terms are governed by the laws of India. Any dispute is subject to the exclusive jurisdiction of the courts at Hyderabad, Telangana.",
    ],
  },
];

function questionsSection(email: string | null, phone: string | null): LegalSection {
  const channels = [email ? `email ${email}` : null, phone ? `call +91 ${phone}` : null]
    .filter(Boolean)
    .join(" or ");

  return {
    heading: "Questions",
    paragraphs: [
      channels
        ? `To ask about anything here, ${channels} and we will explain it in plain language.`
        : "The contact page has our current phone number and email. We will explain anything on this page in plain language.",
    ],
  };
}

export function TermsPage() {
  const { site, primaryPhone } = useSite();

  const sections = [
    aboutSection(site?.legalName ?? site?.name ?? BRAND_NAME),
    ...SECTIONS,
    questionsSection(site?.email ?? null, primaryPhone),
  ];

  return (
    <>
      <Seo
        title={`Terms of Use | ${BRAND_NAME} Secunderabad`}
        description="Terms governing the use of the Madhuri Jewellers website — accuracy of listings, pricing, hallmarking, images, intellectual property and governing law."
        path="/terms"
      />

      <LegalPage
        eyebrow="Legal"
        title="Terms of Use"
        updated="1 August 2026"
        image="temple"
        path="/terms"
        intro="The terms under which we publish this website, and what it does and does not commit us to."
        sections={sections}
      />
    </>
  );
}
