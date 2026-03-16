
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const ServicesSection = () => {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16 max-w-4xl mx-auto">
      {/* Staff Training */}
      <div className="text-center flex flex-col h-full">
        <div className="flex justify-center mb-6">
          <img 
            src="/lovable-uploads/7c28857a-0237-401c-9740-5a72a7c324c7.png" 
            alt="Leadership Training 300 Track" 
            className="w-full max-w-xs h-auto object-contain"
          />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">STAFF TRAINING</h3>
        <p className="text-gray-600 mb-8 leading-relaxed flex-grow">
          Our onboarding training equips new team members with the knowledge and skills needed to navigate the complexities of immigration law practice efficiently from day one.
        </p>
        <Button 
          onClick={() => navigate('/law-firm-staff-training')}
          className="text-black font-semibold px-8 py-3 rounded-md transition-colors"
          style={{ backgroundColor: '#FFDA00' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E6C400'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFDA00'}
        >
          Learn More
        </Button>
      </div>

      {/* Immigration Law */}
      <div className="text-center flex flex-col h-full">
        <div className="flex justify-center mb-6">
          <img 
            src="/lovable-uploads/ce3df313-7cfb-4830-9476-2f7bd4e1715b.png" 
            alt="Legal Training 100 Track" 
            className="w-full max-w-xs h-auto object-contain"
          />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">IMMIGRATION LAW</h3>
        <p className="text-gray-600 mb-8 leading-relaxed flex-grow">
          Deepen your understanding of ever-evolving immigration policies, legal frameworks, and procedural nuances to better serve our clients and strengthen our practice.
        </p>
        <Button 
          onClick={() => navigate('/immigration-law-training')}
          className="text-black font-semibold px-8 py-3 rounded-md transition-colors"
          style={{ backgroundColor: '#FFDA00' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E6C400'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFDA00'}
        >
          Learn More
        </Button>
      </div>
    </div>
  );
};

export default ServicesSection;
