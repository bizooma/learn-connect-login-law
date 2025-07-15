import SimpleNavigationHeader from "./homepage/SimpleNavigationHeader";
import ImmigrationLawHeroSection from "./homepage/ImmigrationLawHeroSection";
import StaffTrainingSection from "./homepage/StaffTrainingSection";
import TestimonialsSection from "./homepage/TestimonialsSection";
import PricingSection from "./homepage/PricingSection";
import NewsletterSection from "./homepage/NewsletterSection";
import PodcastSection from "./homepage/PodcastSection";
import Footer from "./homepage/Footer";

const ImmigrationLawTraining = () => {
  return (
    <div className="min-h-screen">
      <SimpleNavigationHeader />
      <ImmigrationLawHeroSection />

      {/* Staff Training Section */}
      <StaffTrainingSection />

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

export default ImmigrationLawTraining;