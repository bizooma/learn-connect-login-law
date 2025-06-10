
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
      <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center text-white">
          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
            Immigration Law Firms
          </h1>
          
          {/* Subheading */}
          <p className="text-xl md:text-2xl mb-12 max-w-4xl leading-relaxed">
            I created this training platform for immigration law firms to help YOU help more immigrants, without putting anything else on your plate.
          </p>
        </div>
        
        {/* Bottom Section */}
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Immigration Law Firm Owners
          </h2>
          <p className="text-lg text-white max-w-4xl">
            New Frontier University's training courses are expertly designed to streamline the onboarding process and elevate employee training for law firms. Our curriculum combines industry-leading best practices with engaging, interactive content that addresses the unique challenges of the legal environment.
          </p>
        </div>
      </div>
    </section>
  );
};

export default LawFirmsHeroSection;
