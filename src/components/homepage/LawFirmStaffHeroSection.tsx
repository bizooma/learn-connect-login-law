const LawFirmStaffHeroSection = () => {
  return (
    <section 
      className="relative"
      style={{
        backgroundImage: 'url(/lovable-uploads/87798df4-9052-47e6-8771-6cb3e6729e0a.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: 'calc(100vh - 500px)'
      }}
    >
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/50"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(80vh - 400px)' }}>
          {/* Center Content */}
          <div className="text-white text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-8 leading-tight">
              Immigration Law Firm Staff Training
            </h1>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <div className="bg-gray-900 text-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Our Courses Are Designed For <span style={{ color: '#FFDA00' }}>YOU!</span>
            </h2>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LawFirmStaffHeroSection;