

## Refocus Public Pages: Internal Training Tool

### What's Changing

The site is pivoting from selling LMS access to external law firms to being an **internal training platform** for New Frontier Immigration Law's own staff. This means removing external-facing sales content and reframing everything around internal onboarding and staff development.

### Files to Modify

**1. SimpleNavigationHeader.tsx** — Remove "Law Firms" nav link (desktop + mobile). Keep Home, Staff Training, Immigration Law, Podcast, Login.

**2. NavigationHeader.tsx** — Same nav link removal for the alternate header.

**3. Footer.tsx** — Remove "Law Firms" from footer links. Update remaining links to match new nav.

**4. HeroSection.tsx** — Update headline from "Immigration Law Firm Training" to something like "Internal Staff Training Platform". Update copy to focus on onboarding new team members and internal skill development rather than selling to external firms.

**5. ServicesSection.tsx** — Remove the "Law Firms" card entirely. Restructure to a 2-column grid with just "Staff Training" and "Immigration Law". Update copy to focus on internal training benefits.

**6. BenefitsSection.tsx** — Change heading from "How Will New Frontier University Help Your Firm?" to "How Will NF+U Help Your Team?" Adjust benefit copy to speak to internal staff rather than external firm owners (remove "your firm" language, use "our team" language).

**7. TrustedBrandsSection.tsx** — Change heading from "Immigration Law Firm Owners" to something relevant to internal training excellence. Update copy to focus on training quality and internal development rather than selling to firm owners.

**8. HillarySection.tsx** — Adjust Hillary's message to address internal team members rather than external firm owners. Remove the "contact form" sales component or repurpose it.

**9. PricingSection.tsx** — Remove entirely from the homepage since this is no longer a product being sold externally. Remove the import and usage from Homepage.tsx.

**10. Homepage.tsx** — Remove PricingSection from the page layout.

**11. App.tsx** — Remove the `/law-firm-training` route. Keep `/law-firm-staff-training` and `/immigration-law-training` as they still serve internal training purposes.

**12. LawFirmTraining.tsx & LawFirmHeroSection.tsx** — These can be removed since the law firm sales page is no longer needed.

### Copy Direction

- "Your firm" → "our team"
- "Law firm owners" → "team members" / "new hires"
- Sales language → onboarding/development language
- External pitch → internal empowerment messaging
- Keep Hillary's personal story but frame it as "why I built this for our team"

