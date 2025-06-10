
import SimpleNavigationHeader from "./homepage/SimpleNavigationHeader";
import LawFirmsHeroSection from "./law-firms/LawFirmsHeroSection";
import Footer from "./homepage/Footer";

const LawFirmsTrainingPage = () => {
  return (
    <div className="min-h-screen">
      <SimpleNavigationHeader />
      <LawFirmsHeroSection />
      
      {/* Additional sections can be added here */}
      
      <Footer />
    </div>
  );
};

export default LawFirmsTrainingPage;
