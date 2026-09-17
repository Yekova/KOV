const SITE_URL = "https://kov-agency.site";

// Two static, fully hardcoded JSON-LD blocks rendered once sitewide — no
// user input involved, so dangerouslySetInnerHTML here carries no XSS risk
// (unlike the lead-email templates elsewhere in this codebase, which escape
// real public form input). No SearchAction on the WebSite block: the site's
// own search is a client-side fuzzy index over a static array, not a real
// queryable URL — claiming one would be a functional lie to crawlers. No
// street address/SIRET on the Organization block either — those are still
// placeholders on /legal. That note is now out of date — /legal and /legal/cgv
// publish a real, registry-verified SIRET and street address (they are legally
// required to). Adding them here would be honest and would help local search.
// It is deliberately left undone all the same: KOV is an entreprise
// individuelle, so that street address is a home address, and broadcasting it
// in structured data on every page of the site is the owner's call to make,
// not a technical default. See SEO_AUDIT.md, "Actions manuelles".
// Only the city is asserted here.
export function OrganizationJsonLd() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "KOV",
    url: SITE_URL,
    logo: `${SITE_URL}/kov/brand/kov-wordmark-bone.png`,
    description: "KOV est un studio de design, développement et motion basé à Bordeaux, France.",
    address: { "@type": "PostalAddress", addressLocality: "Bordeaux", addressCountry: "FR" },
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "KOV",
    url: SITE_URL,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }} />
    </>
  );
}
