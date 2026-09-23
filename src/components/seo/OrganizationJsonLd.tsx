import "server-only";
import { getBusinessInfo } from "@/lib/billing/businessInfo";

const SITE_URL = "https://kov-agency.site";

// Two static JSON-LD blocks rendered once sitewide. No user input is
// involved, so dangerouslySetInnerHTML here carries no XSS risk (unlike the
// lead-email templates elsewhere in this codebase, which escape real public
// form input). No SearchAction on the WebSite block: the site's own search
// is a client-side fuzzy index over a static array, not a real queryable
// URL, and claiming one would be a functional lie to crawlers.
//
// The street address is here now, on the owner's explicit instruction. It
// had been left out on purpose: KOV is an entreprise individuelle, so this
// is a home address, and broadcasting it in structured data on every page
// is a decision only the owner can make. They made it.
//
// Typed ProfessionalService rather than Organization. It is a subtype of
// LocalBusiness, which is itself a subtype of Organization, so one node
// carries all three rather than declaring two that a parser then has to
// reconcile. The @id lets later pages point at this same entity instead of
// describing a second one.
//
// Read from getBusinessInfo rather than retyped, and that is not a
// preference. The repo's own fallback copy of this address had drifted to
// the wrong postcode (33000 against the 33200 the live legal pages have
// been publishing), which nobody would have noticed until a failed read
// put a false postcode on a legally required page. An address written in
// two places is an address that disagrees with itself eventually. Fixed in
// businessInfo.ts in the same pass.
//
// Deliberately absent, because each would be invented: telephone (the owner
// asked for the number to be taken off the site, WhatsApp only, and putting
// it back in machine-readable form would undo that), openingHours, geo
// coordinates, priceRange, and any kind of rating. sameAs is absent too:
// the repo holds no real social profile, only share-intent URLs.
export async function OrganizationJsonLd() {
  const business = await getBusinessInfo();

  const organization = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${SITE_URL}/#organization`,
    name: "KOV",
    legalName: business.legalName,
    url: SITE_URL,
    logo: `${SITE_URL}/kov/brand/kov-wordmark-bone.png`,
    image: `${SITE_URL}/kov/brand/kov-wordmark-bone.png`,
    description:
      "KOV est un studio de design, développement et motion basé à Bordeaux. Création et refonte de sites internet sur mesure.",
    address: {
      "@type": "PostalAddress",
      streetAddress: business.address.street,
      postalCode: business.address.postalCode,
      addressLocality: business.address.city,
      addressCountry: "FR",
    },
    // The studio is in Bordeaux and the work is not limited to it. Both are
    // stated rather than one: the city is what local search matches on, the
    // country is what the service area actually is.
    areaServed: [
      { "@type": "City", name: "Bordeaux" },
      { "@type": "Country", name: "France" },
    ],
    knowsAbout: [
      "Création de site internet",
      "Refonte de site internet",
      "Design d'interface",
      "Développement web",
      "Motion design",
      "Référencement",
    ],
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "KOV",
    url: SITE_URL,
    publisher: { "@id": `${SITE_URL}/#organization` },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }} />
    </>
  );
}
