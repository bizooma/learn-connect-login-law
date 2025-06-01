
import { Button } from "@/components/ui/button";
import { Scale, Users, FileText } from "lucide-react";

const ServicesSection = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
      {/* Law Firms */}
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <Scale className="h-16 w-16 text-blue-500" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">LAW FIRMS</h3>
        <p className="text-gray-600 mb-8 leading-relaxed">
          New Frontier University offers comprehensive immigration law firm training courses designed to enhance the efficiency, compliance, and strategic growth of legal practices.
        </p>
        <Button className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-8 py-3 rounded-md">
          Learn More
        </Button>
      </div>

      {/* Staff Training */}
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <Users className="h-16 w-16 text-blue-500" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">STAFF TRAINING</h3>
        <p className="text-gray-600 mb-8 leading-relaxed">
          New Frontier University's immigration law firm onboarding training is designed to equip new employees with the knowledge and skills needed to navigate the complexities of immigration law practice efficiently.
        </p>
        <Button className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-8 py-3 rounded-md">
          Learn More
        </Button>
      </div>

      {/* Immigration Law */}
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <FileText className="h-16 w-16 text-blue-500" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">IMMIGRATION LAW</h3>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Understanding the complexities of immigration law requires a deep dive into ever-evolving policies, legal frameworks, and procedural nuances that impact individuals and businesses navigating the immigration system.
        </p>
        <Button className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-8 py-3 rounded-md">
          Learn More
        </Button>
      </div>
    </div>
  );
};

export default ServicesSection;
