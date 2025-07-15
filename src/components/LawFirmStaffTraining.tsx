import SimpleNavigationHeader from "./homepage/SimpleNavigationHeader";
import LawFirmStaffHeroSection from "./homepage/LawFirmStaffHeroSection";
import TrustedBrandsSection from "./homepage/TrustedBrandsSection";
import TestimonialsSection from "./homepage/TestimonialsSection";
import PricingSection from "./homepage/PricingSection";
import NewsletterSection from "./homepage/NewsletterSection";
import PodcastSection from "./homepage/PodcastSection";
import Footer from "./homepage/Footer";

const LawFirmStaffTraining = () => {
  return (
    <div className="min-h-screen">
      <SimpleNavigationHeader />
      <LawFirmStaffHeroSection />

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

export default LawFirmStaffTraining;