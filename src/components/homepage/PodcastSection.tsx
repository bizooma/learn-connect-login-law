
const PodcastSection = () => {

  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Side - Podcast Branding */}
          <div className="text-center lg:text-left">
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-8">
              Let's Get Rich PODCAST
            </h2>
            
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              This podcast is for entrepreneurs who want to live rich lives that leave a legacy. Your hosts, Hillary & Shawn Walsh, are an award-winning entrepreneur power couple. In this show, they share real-life, actionable advice on how to grow your law firm and make an impact.
            </p>

            {/* Podcast Player with New Image */}
            <div className="max-w-sm mx-auto lg:mx-0">
              <img 
                src="/lovable-uploads/01509898-2441-4731-b9a9-d242e1be7ed3.png"
                alt="Let's Get Rich Podcast - Hillary & Shawn Walsh"
                className="w-full h-auto rounded-3xl shadow-lg"
              />
            </div>
          </div>

          {/* Right Side - Embedded Podcast Player */}
          <div className="w-full">
            <iframe 
              data-testid="embed-iframe"
              style={{ borderRadius: '12px' }}
              src="https://open.spotify.com/embed/show/52fVHoDW007j6BdyiAD1Nw?utm_source=generator" 
              width="100%" 
              height="352" 
              frameBorder="0" 
              allowFullScreen
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default PodcastSection;
