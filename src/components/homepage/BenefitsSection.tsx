
import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const BenefitsSection = () => {
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
    <div>
      {/* Section Heading */}
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
          How Will New Frontier University<br />Help Your Firm?
        </h2>
      </div>

      {/* Collapsible Benefits Section */}
      <div className="max-w-4xl mx-auto space-y-4 mb-20">
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
                You've hired "experienced" paralegals – people you've paid top dollar to work with. But you've found that their "experience" varies, so you must spend time acclimating them to how you do things at your firm.
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
                Some of your best team members are now training all the new people, while also managing their own caseloads. Your best people are now drowning in questions; everyone needs their help. And now their production is suffering.
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
  );
};

export default BenefitsSection;
