import { createBrowserRouter } from "react-router-dom";
import { ErrorPage, NotFoundPage, RootLayout } from "@/components/layout/RootLayout";

import { HomePage } from "@/routes/index";
import { AboutPage } from "@/routes/about";
import { ContactPage } from "@/routes/contact";
import { FaqsPage } from "@/routes/faqs";
import { GalleryPage } from "@/routes/gallery";
import { LatestCollectionsPage } from "@/routes/latest-collections";
import { NewArrivalsPage } from "@/routes/new-arrivals";
import { OffersPage } from "@/routes/offers";
import { TestimonialsPage } from "@/routes/testimonials";
import { PrivacyPage } from "@/routes/privacy-policy";
import { ProductPage } from "@/routes/product";
import { TermsPage } from "@/routes/terms";

import { AntiqueJewelleryPage } from "@/routes/antique-jewellery";
import { BanglesPage } from "@/routes/bangles";
import { BridalCollectionPage } from "@/routes/bridal-collection";
import { ChainsPage } from "@/routes/chains";
import { DiamondJewelleryPage } from "@/routes/diamond-jewellery";
import { EarringsPage } from "@/routes/earrings";
import { GoldJewelleryPage } from "@/routes/gold-jewellery";
import { NecklacesPage } from "@/routes/necklaces";
import { PendantsPage } from "@/routes/pendants";
import { RingsPage } from "@/routes/rings";
import { SilverJewelleryPage } from "@/routes/silver-jewellery";
import { TempleJewelleryPage } from "@/routes/temple-jewellery";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <HomePage /> },

      { path: "about", element: <AboutPage /> },
      { path: "contact", element: <ContactPage /> },
      { path: "faqs", element: <FaqsPage /> },
      { path: "gallery", element: <GalleryPage /> },
      { path: "latest-collections", element: <LatestCollectionsPage /> },
      { path: "new-arrivals", element: <NewArrivalsPage /> },
      { path: "offers", element: <OffersPage /> },
      { path: "testimonials", element: <TestimonialsPage /> },
      { path: "privacy-policy", element: <PrivacyPage /> },
      { path: "terms", element: <TermsPage /> },

      // Dynamic product detail. One route serves every piece in the catalogue —
      // adding a product in the dashboard needs no code change here.
      { path: "product/:slug", element: <ProductPage /> },

      { path: "antique-jewellery", element: <AntiqueJewelleryPage /> },
      { path: "bangles", element: <BanglesPage /> },
      { path: "bridal-collection", element: <BridalCollectionPage /> },
      { path: "chains", element: <ChainsPage /> },
      { path: "diamond-jewellery", element: <DiamondJewelleryPage /> },
      { path: "earrings", element: <EarringsPage /> },
      { path: "gold-jewellery", element: <GoldJewelleryPage /> },
      { path: "necklaces", element: <NecklacesPage /> },
      { path: "pendants", element: <PendantsPage /> },
      { path: "rings", element: <RingsPage /> },
      { path: "silver-jewellery", element: <SilverJewelleryPage /> },
      { path: "temple-jewellery", element: <TempleJewelleryPage /> },

      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
