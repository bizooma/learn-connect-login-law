
import { Button } from "@/components/ui/button";

const LawFirmsHeroSection = () => {
  return (
    <section 
      className="relative min-h-screen bg-cover bg-center bg-no-repeat flex items-center"
      style={{
        backgroundImage: `url('/lovable-uploads/ba31bdbc-6d6d-4288-96f0-3e8c597d0882.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black bg-opacity-60"></div>
      
      <div className="relative z-10 w-full">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Main Heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-8 leading-tight">
            Immigration Law Firms
          </h1>
          
          {/* Subheading */}
          <p className="text-xl md:text-2xl lg:text-3xl text-white mb-12 max-w-5xl mx-auto leading-relaxed font-medium">
            I created this training platform for immigration law firms to help YOU help more immigrants, without putting anything else on your plate.
          </p>
          
          {/* CTA Button */}
          <div className="mb-20">
            <Button 
              className="text-black font-bold px-10 py-6 text-xl rounded-lg transition-all duration-300 hover:scale-105 shadow-lg"
              style={{ backgroundColor: '#FFDA00' }}
            >
              Get Started Today
            </Button>
          </div>
          
          {/* Bottom Section */}
          <div className="mt-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-8">
              Immigration Law Firm Owners
            </h2>
            <div className="max-w-4xl mx-auto">
              <p className="text-lg md:text-xl lg:text-2xl text-white leading-relaxed font-light">
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
