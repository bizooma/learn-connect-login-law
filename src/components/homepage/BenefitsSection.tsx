
import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const BenefitsSection = () => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    saveTime: true,
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
          How Will NF+U Help<br />Our Team?
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
                We've trained <span className="font-semibold italic">countless</span> people. In the early years, we were more thorough, but as we've grown it's become harder to train every new hire to our standards. This platform ensures consistent, high-quality training without pulling senior team members away from their work.
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
                Even experienced new hires need to learn how we do things here. This training ensures every team member—regardless of background—gets the same foundational knowledge and is aligned with our processes and standards.
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
                Our best team members shouldn't have to choose between training new people and managing their own caseloads. This platform handles foundational training so our top performers can stay focused on what they do best.
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
                With structured training in place, every team member has a clear path to learn our standards. This makes it fair and straightforward to hold everyone accountable—because everyone has been given the tools to succeed.
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
                We're here because we want to help people. The better trained our team is, the more immigrant lives we can change—and the higher the standard at which we can do it.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BenefitsSection;
