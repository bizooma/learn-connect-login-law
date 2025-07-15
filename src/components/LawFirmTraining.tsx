import SimpleNavigationHeader from "./homepage/SimpleNavigationHeader";
import LawFirmHeroSection from "./homepage/LawFirmHeroSection";
import ServicesSection from "./homepage/ServicesSection";
import BenefitsSection from "./homepage/BenefitsSection";
import AboutSection from "./homepage/AboutSection";
import HillarySection from "./homepage/HillarySection";
import TrustedBrandsSection from "./homepage/TrustedBrandsSection";
import TestimonialsSection from "./homepage/TestimonialsSection";
import PricingSection from "./homepage/PricingSection";
import NewsletterSection from "./homepage/NewsletterSection";
import PodcastSection from "./homepage/PodcastSection";
import Footer from "./homepage/Footer";

const LawFirmTraining = () => {
  return (
    <div className="min-h-screen">
      <SimpleNavigationHeader />
      <LawFirmHeroSection />

      {/* Hillary Section */}
      <HillarySection />

      {/* Trusted Brands Section */}
      <TrustedBrandsSection />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Pricing Section */}
      <PricingSection />

      {/* Newsletter Section */}
      <NewsletterSection />

      {/* Podcast Section */}
      <PodcastSection />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LawFirmTraining;