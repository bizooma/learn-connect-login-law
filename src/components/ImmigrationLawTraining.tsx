import SimpleNavigationHeader from "./homepage/SimpleNavigationHeader";
import ImmigrationLawHeroSection from "./homepage/ImmigrationLawHeroSection";
import ImmigrationLawSection from "./homepage/ImmigrationLawSection";
import TestimonialsSection from "./homepage/TestimonialsSection";
import NewsletterSection from "./homepage/NewsletterSection";
import PodcastSection from "./homepage/PodcastSection";
import Footer from "./homepage/Footer";

const ImmigrationLawTraining = () => {
  return (
    <div className="min-h-screen">
      <SimpleNavigationHeader />
      <ImmigrationLawHeroSection />

      {/* Immigration Law Section */}
      <ImmigrationLawSection />

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

export default ImmigrationLawTraining;