
import { Button } from "@/components/ui/button";

const LawFirmsHeroSection = () => {
  return (
    <section 
      className="relative min-h-screen bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url('/lovable-uploads/ba31bdbc-6d6d-4288-96f0-3e8c597d0882.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-center min-h-screen pt-20 pb-32">
          
          {/* Main Content Area */}
          <div className="text-center text-white mb-16">
            {/* Main Heading */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Immigration Law Firms
            </h1>
            
            {/* Subheading */}
            <p className="text-lg md:text-xl lg:text-2xl mb-8 max-w-5xl mx-auto leading-relaxed">
              I created this training platform for immigration law firms to help YOU help more immigrants, without putting anything else on your plate.
            </p>
            
            {/* CTA Button */}
            <Button 
              className="text-black font-semibold px-8 py-4 text-lg rounded-md transition-colors hover:opacity-90"
              style={{ backgroundColor: '#FFDA00' }}
            >
              Get Started Today
            </Button>
          </div>
          
          {/* Bottom Section */}
          <div className="text-center text-white">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6">
              Immigration Law Firm Owners
            </h2>
            <div className="max-w-5xl mx-auto">
              <p className="text-base md:text-lg lg:text-xl leading-relaxed">
                New Frontier University's training courses are expertly designed to streamline the onboarding process and elevate employee training for law firms. Our curriculum combines industry-leading best practices with engaging, interactive content that addresses the unique challenges of the legal environment.
              </p>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
};

export default LawFirmsHeroSection;
