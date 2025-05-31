
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tables } from "@/integrations/supabase/types";

type Section = Tables<'sections'> & {
  units: Tables<'units'>[];
};

interface SectionHeaderProps {
  section: Section;
}

const SectionHeader = ({ section }: SectionHeaderProps) => {
  const navigate = useNavigate();

  const totalDuration = section.units.reduce((acc, unit) => acc + (unit.duration_minutes || 0), 0);

  return (
    <>
      {/* Header */}
      <div className="shadow-sm border-b" style={{ backgroundColor: '#213C82' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="hover:bg-white/10 text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-white">
                <Clock className="h-4 w-4 mr-1" />
                {totalDuration} minutes
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Header */}
      <div className="border-b" style={{ backgroundColor: '#213C82' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h1 className="text-3xl font-bold text-white mb-4">{section.title}</h1>
              <p className="text-white/90 mb-6">{section.description}</p>
              <div className="flex flex-wrap items-center gap-6 text-sm text-white/80">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  {section.units.length} units
                </div>
                <div>
                  Total duration: <span className="font-medium text-white">{totalDuration} minutes</span>
                </div>
              </div>
            </div>
            <div className="lg:col-span-1">
              {section.image_url && (
                <img
                  src={section.image_url}
                  alt={section.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SectionHeader;
