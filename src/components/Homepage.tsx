
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Scale, Users, FileText, Plus, Minus } from "lucide-react";
import { useState } from "react";

const Homepage = () => {
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    saveTime: true, // Save Time section is open by default as shown in screenshot
  });

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  return (
    <div className="min-h-screen">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <img 
                src="/lovable-uploads/126f6dae-4376-4b57-9955-f40fc6fa19e2.png" 
                alt="New Frontier University" 
                className="h-12 w-auto"
              />
            </div>

            {/* Navigation Menu */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-gray-900 hover:text-blue-600 font-medium">LAW FIRMS</a>
              <a href="#" className="text-gray-900 hover:text-blue-600 font-medium">STAFF TRAINING</a>
              <a href="#" className="text-gray-900 hover:text-blue-600 font-medium">IMMIGRATION LAW</a>
              <a href="#" className="text-gray-900 hover:text-blue-600 font-medium">PODCAST</a>
            </nav>

            {/* Login Button */}
            <Button 
              onClick={() => navigate("/login")}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Login
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        className="relative min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600"
        style={{
          backgroundImage: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%)"
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
            {/* Left Side - Content */}
            <div className="text-white">
              <h1 className="text-5xl md:text-6xl font-bold mb-8 leading-tight">
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
            <div className="relative">
              <div className="relative z-10">
                <img 
                  src="/lovable-uploads/8824b54f-412f-4fa9-9ec4-a10b1d510a25.png" 
                  alt="Professional woman with tablet" 
                  className="w-full max-w-lg mx-auto"
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

      {/* Services Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

          {/* Divider Line */}
          <div className="border-t border-gray-300 mb-16"></div>

          {/* Next Section Heading */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              How Will New Frontier University Help Your Firm?
            </h2>
          </div>

          {/* Collapsible Benefits Section */}
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Save Time Section */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('saveTime')}
                className="w-full flex items-center justify-between p-6 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
              >
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  {openSections.saveTime ? (
                    <Minus className="mr-3 h-5 w-5" />
                  ) : (
                    <Plus className="mr-3 h-5 w-5" />
                  )}
                  Save Time
                </h3>
              </button>
              {openSections.saveTime && (
                <div className="p-6 bg-white border-t border-gray-200">
                  <p className="text-gray-600 leading-relaxed">
                    You've trained <span className="font-semibold italic">countless</span> people. In the early years, you were more thorough, but now you're too swamped to train the new hires to your standards.
                  </p>
                </div>
              )}
            </div>

            {/* Consistency Section */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('consistency')}
                className="w-full flex items-center justify-between p-6 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
              >
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  {openSections.consistency ? (
                    <Minus className="mr-3 h-5 w-5" />
                  ) : (
                    <Plus className="mr-3 h-5 w-5" />
                  )}
                  Consistency
                </h3>
              </button>
              {openSections.consistency && (
                <div className="p-6 bg-white border-t border-gray-200">
                  <p className="text-gray-600 leading-relaxed">
                    Ensure all your staff members receive the same high-quality training, regardless of who conducts it or when they join your firm.
                  </p>
                </div>
              )}
            </div>

            {/* Productivity Section */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('productivity')}
                className="w-full flex items-center justify-between p-6 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
              >
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  {openSections.productivity ? (
                    <Minus className="mr-3 h-5 w-5" />
                  ) : (
                    <Plus className="mr-3 h-5 w-5" />
                  )}
                  Productivity
                </h3>
              </button>
              {openSections.productivity && (
                <div className="p-6 bg-white border-t border-gray-200">
                  <p className="text-gray-600 leading-relaxed">
                    Increase your team's efficiency with structured training that gets new hires up to speed faster and existing staff performing at their best.
                  </p>
                </div>
              )}
            </div>

            {/* Accountability Section */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('accountability')}
                className="w-full flex items-center justify-between p-6 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
              >
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  {openSections.accountability ? (
                    <Minus className="mr-3 h-5 w-5" />
                  ) : (
                    <Plus className="mr-3 h-5 w-5" />
                  )}
                  Accountability
                </h3>
              </button>
              {openSections.accountability && (
                <div className="p-6 bg-white border-t border-gray-200">
                  <p className="text-gray-600 leading-relaxed">
                    Track progress and ensure completion with built-in accountability measures that keep your team on track and motivated.
                  </p>
                </div>
              )}
            </div>

            {/* Purpose and Passion Section */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('purpose')}
                className="w-full flex items-center justify-between p-6 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
              >
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  {openSections.purpose ? (
                    <Minus className="mr-3 h-5 w-5" />
                  ) : (
                    <Plus className="mr-3 h-5 w-5" />
                  )}
                  Purpose and Passion
                </h3>
              </button>
              {openSections.purpose && (
                <div className="p-6 bg-white border-t border-gray-200">
                  <p className="text-gray-600 leading-relaxed">
                    Reinvigorate your team's commitment to the mission of helping immigrants achieve their dreams through comprehensive, purpose-driven training.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Homepage;
