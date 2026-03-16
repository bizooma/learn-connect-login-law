import SimpleNavigationHeader from "./homepage/SimpleNavigationHeader";
import LawFirmStaffHeroSection from "./homepage/LawFirmStaffHeroSection";
import StaffTrainingSection from "./homepage/StaffTrainingSection";
import TestimonialsSection from "./homepage/TestimonialsSection";
import NewsletterSection from "./homepage/NewsletterSection";
import PodcastSection from "./homepage/PodcastSection";
import Footer from "./homepage/Footer";

const LawFirmStaffTraining = () => {
  return (
    <div className="min-h-screen">
      <SimpleNavigationHeader />
      <LawFirmStaffHeroSection />

      {/* Staff Training Section */}
      <StaffTrainingSection />

      {/* Testimonials Section */}
      <TestimonialsSection />

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