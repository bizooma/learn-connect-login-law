
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const TrustedBrandsSection = () => {
  const brands = [
    {
      name: "NPR",
      logo: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=200&h=100&fit=crop&crop=center",
      alt: "NPR Logo"
    },
    {
      name: "American Immigration Lawyers Association",
      logo: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=100&fit=crop&crop=center",
      alt: "AILA Logo"
    },
    {
      name: "ABC 15 Arizona",
      logo: "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=200&h=100&fit=crop&crop=center",
      alt: "ABC 15 Arizona Logo"
    },
    {
      name: "Forbes",
      logo: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=200&h=100&fit=crop&crop=center",
      alt: "Forbes Logo"
    },
    {
      name: "Newsweek",
      logo: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=100&fit=crop&crop=center",
      alt: "Newsweek Logo"
    }
  ];

  return (
    <section className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-700 mb-4">
            Trusted By The Brands You Know
          </h2>
        </div>

        <div className="relative">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full max-w-5xl mx-auto"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {brands.map((brand, index) => (
                <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/3 lg:basis-1/4">
                  <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 h-32 flex items-center justify-center">
                    <img
                      src={brand.logo}
                      alt={brand.alt}
                      className="max-w-full max-h-16 object-contain grayscale hover:grayscale-0 transition-all duration-300"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
          </Carousel>
        </div>
      </div>
    </section>
  );
};

export default TrustedBrandsSection;
