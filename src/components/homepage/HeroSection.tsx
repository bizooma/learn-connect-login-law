

const HeroSection = () => {
  return (
    <section 
      className="relative"
      style={{
        background: 'linear-gradient(to bottom, #213C82 0%, rgba(255, 255, 255, 0.1) 100%)',
        minHeight: 'calc(100vh - 400px)'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start" style={{ minHeight: 'calc(80vh - 400px)' }}>
          {/* Left Side - Content */}
          <div className="text-white">
            <h1 className="text-5xl md:text-6xl font-bold mb-8 leading-tight whitespace-nowrap">
              Immigration Law Firm Training
            </h1>
            
            {/* Category Cards - Reordered with Legal first, then Sales */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
              {/* Legal Training 100 */}
              <div className="relative group cursor-pointer">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-0 h-32 overflow-hidden transition-transform hover:scale-105">
                  <img 
                    src="/lovable-uploads/b99418cf-ba10-4d30-b227-6114c570b88f.png" 
                    alt="Legal Training 100" 
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              </div>
              
              {/* Legal Training 200 */}
              <div className="relative group cursor-pointer">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-0 h-32 overflow-hidden transition-transform hover:scale-105">
                  <img 
                    src="/lovable-uploads/c714af9d-aba5-4b13-932f-39b27929b695.png" 
                    alt="Legal Training 200" 
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              </div>
              
              {/* Legal Training 300 */}
              <div className="relative group cursor-pointer">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-0 h-32 overflow-hidden transition-transform hover:scale-105">
                  <img 
                    src="/lovable-uploads/85b49a80-3092-4f89-b069-0c652d3d7d4f.png" 
                    alt="Legal Training 300" 
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Second row - Sales Training */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
              {/* Sales Training 100 */}
              <div className="relative group cursor-pointer">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-0 h-32 overflow-hidden transition-transform hover:scale-105">
                  <img 
                    src="/lovable-uploads/b99418cf-ba10-4d30-b227-6114c570b88f.png" 
                    alt="Sales Training 100" 
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              </div>
              
              {/* Sales Training 200 */}
              <div className="relative group cursor-pointer">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-0 h-32 overflow-hidden transition-transform hover:scale-105">
                  <img 
                    src="/lovable-uploads/c714af9d-aba5-4b13-932f-39b27929b695.png" 
                    alt="Sales Training 200" 
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              </div>
              
              {/* Sales Training 300 */}
              <div className="relative group cursor-pointer">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-0 h-32 overflow-hidden transition-transform hover:scale-105">
                  <img 
                    src="/lovable-uploads/85b49a80-3092-4f89-b069-0c652d3d7d4f.png" 
                    alt="Sales Training 300" 
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Professional Woman Image */}
          <div className="relative h-full flex items-end justify-end lg:justify-start lg:pl-8" style={{ transform: 'translateY(-40px)' }}>
            <div className="relative z-50 w-full">
              <img 
                src="/lovable-uploads/61c3f405-c372-43ea-a6e7-a12bcd703981.png" 
                alt="Professional woman with laptop" 
                className="w-full max-w-lg ml-auto lg:ml-8 object-contain"
                style={{ height: 'auto', maxHeight: '600px' }}
              />
            </div>
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

export default HeroSection;

