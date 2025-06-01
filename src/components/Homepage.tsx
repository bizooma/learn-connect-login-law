
import NavigationHeader from "./homepage/NavigationHeader";
import HeroSection from "./homepage/HeroSection";
import ServicesSection from "./homepage/ServicesSection";
import BenefitsSection from "./homepage/BenefitsSection";
import AboutSection from "./homepage/AboutSection";
import HillarySection from "./homepage/HillarySection";
import TrustedBrandsSection from "./homepage/TrustedBrandsSection";
import TestimonialsSection from "./homepage/TestimonialsSection";
import PricingSection from "./homepage/PricingSection";

const Homepage = () => {
  return (
    <div className="min-h-screen">
      <NavigationHeader />
      <HeroSection />

      {/* Services Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ServicesSection />

          {/* Divider Line */}
          <div className="border-t border-gray-300 mb-16"></div>

          <BenefitsSection />
          <AboutSection />
        </div>
      </section>

      {/* Hillary Section */}
      <HillarySection />

      {/* Trusted Brands Section */}
      <TrustedBrandsSection />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Pricing Section */}
      <PricingSection />
    </div>
  );
};

export default Homepage;
