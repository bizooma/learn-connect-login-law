
const HeroSection = () => {
  return (
    <section 
      className="relative min-h-screen"
      style={{
        background: 'linear-gradient(to bottom, #213C82 0%, rgba(255, 255, 255, 0.1) 100%)'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start min-h-[80vh]">
          {/* Left Side - Content */}
          <div className="text-white">
            <h1 className="text-5xl md:text-6xl font-bold mb-8 leading-tight whitespace-nowrap">
              Immigration Law Firm Training
            </h1>
            
            {/* Category Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
              <div className="relative group cursor-pointer">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6 h-32 flex items-end transition-transform hover:scale-105">
                  <h3 className="text-xl font-bold text-white">LAW FIRMS</h3>
                </div>
              </div>
              
              <div className="relative group cursor-pointer">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6 h-32 flex items-end transition-transform hover:scale-105">
                  <h3 className="text-xl font-bold text-white">STAFF</h3>
                </div>
              </div>
              
              <div className="relative group cursor-pointer">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6 h-32 flex items-end transition-transform hover:scale-105">
                  <h3 className="text-xl font-bold text-white">IMMIGRATION LAW</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Professional Woman Image */}
          <div className="relative h-full flex items-end">
            <div className="relative z-10 w-full">
              <img 
                src="/lovable-uploads/61c3f405-c372-43ea-a6e7-a12bcd703981.png" 
                alt="Professional woman with laptop" 
                className="w-full max-w-lg mx-auto object-cover object-bottom"
                style={{ height: 'calc(100vh - 10rem)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="absolute bottom-0 left-0 right-0">
        <div className="bg-gray-900 text-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Our Courses Are Designed For <span className="text-pink-400">YOU!</span>
            </h2>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
