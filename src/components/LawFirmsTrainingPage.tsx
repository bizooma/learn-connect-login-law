
import NavigationHeader from "./homepage/NavigationHeader";
import LawFirmsHeroSection from "./law-firms/LawFirmsHeroSection";
import Footer from "./homepage/Footer";

const LawFirmsTrainingPage = () => {
  return (
    <div className="min-h-screen">
      <NavigationHeader />
      <LawFirmsHeroSection />
      
      {/* Additional sections can be added here */}
      
      <Footer />
    </div>
  );
};

export default LawFirmsTrainingPage;
