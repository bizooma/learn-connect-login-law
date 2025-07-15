const ImmigrationLawHeroSection = () => {
  return (
    <section 
      className="relative"
      style={{
        backgroundImage: 'url(/lovable-uploads/8da8f2e2-7dad-45cd-b0e4-2c792df0ba8e.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: 'calc(100vh - 300px)'
      }}
    >
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/50"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-12 md:py-20">
        <div className="flex items-center justify-center min-h-[50vh] md:min-h-[60vh]">
          {/* Center Content */}
          <div className="text-white text-center max-w-xs sm:max-w-sm md:max-w-2xl lg:max-w-4xl mx-auto px-4">
            <h1 className="text-5xl md:text-6xl font-bold mb-8 leading-tight">
              Immigration Law Training
            </h1>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <div className="bg-gray-900 text-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-4 px-4">
              Our Courses Are Designed For <span style={{ color: '#FFDA00' }}>YOU!</span>
            </h2>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ImmigrationLawHeroSection;