
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
      logo: "/lovable-uploads/fccb327a-dee3-43d2-9534-46f737c2d6b1.png",
      alt: "NPR Logo"
    },
    {
      name: "American Immigration Lawyers Association",
      logo: "/lovable-uploads/022a9ee2-9f0d-404d-b1b1-e0016dfd4745.png",
      alt: "AILA Logo"
    },
    {
      name: "ABC 15 Arizona",
      logo: "/lovable-uploads/7dc4ee39-d79f-499a-8e18-e9c976adf13c.png",
      alt: "ABC 15 Arizona Logo"
    },
    {
      name: "Forbes",
      logo: "/lovable-uploads/b049bcfe-4e9f-4c2a-8ffb-1de625d740dc.png",
      alt: "Forbes Logo"
    },
    {
      name: "Newsweek",
      logo: "/lovable-uploads/b07cc2cc-d743-46e8-941b-11bbdef38f62.png",
      alt: "Newsweek Logo"
    },
    {
      name: "American Bar Association",
      logo: "/lovable-uploads/609a75bb-2909-4a15-a3c0-e52a6dee5346.png",
      alt: "American Bar Association Logo"
    },
    {
      name: "Univision Radio",
      logo: "/lovable-uploads/2f70c521-b0d6-447a-b285-f15b1dcd9ce2.png",
      alt: "Univision Radio Logo"
    },
    {
      name: "Arizona Foundation for Legal Services & Education",
      logo: "/lovable-uploads/170f8d22-3835-4ef9-824a-3bc318cbb768.png",
      alt: "Arizona Foundation for Legal Services & Education Logo"
    },
    {
      name: "AVVO",
      logo: "/lovable-uploads/8be626f3-c596-4b4d-8a6b-aa053adcad65.png",
      alt: "AVVO Logo"
    },
    {
      name: "BeConnected Arizona Veteran Supportive Employer",
      logo: "/lovable-uploads/93aac041-3304-49e3-ba31-9fcf66a503a9.png",
      alt: "BeConnected Arizona Veteran Supportive Employer Logo"
    }
  ];

  return (
    <section className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-700 mb-4">
            Immigration Law Firm Owners
          </h2>
          <p className="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed">
            New Frontier University's training courses are expertly designed to streamline the onboarding process and elevate employee training for law firms. Our curriculum combines industry-leading best practices with engaging, interactive content that addresses the unique challenges of the legal environment. Developed by experienced legal professionals, our courses provide comprehensive insights into essential areas such as regulatory compliance, legal procedures, and effective communication, ensuring that new hires quickly gain the skills and confidence needed to excel.
          </p>
        </div>

      </div>
    </section>
  );
};

export default TrustedBrandsSection;
