import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import SectionCard from "./section-manager/SectionCard";
import EmptyState from "./section-manager/EmptyState";
import { useSectionManager } from "./section-manager/useSectionManager";
import { SectionData, UnitData } from "./section-manager/types";

interface SectionManagerProps {
  sections: SectionData[];
  onSectionsChange: (sections: SectionData[]) => void;
}

const SectionManager = ({ sections, onSectionsChange }: SectionManagerProps) => {
  const {
    expandedSections,
    addSection,
    updateSection,
    deleteSection,
    addUnit,
    updateUnit,
    deleteUnit,
    toggleSectionExpanded,
    handleVideoFileChange,
    handleSectionImageUpdate,
  } = useSectionManager({ sections, onSectionsChange });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Course Sections</h3>
        <Button onClick={addSection} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Section
        </Button>
      </div>

      {sections.map((section, sectionIndex) => (
        <SectionCard
          key={sectionIndex}
          section={section}
          sectionIndex={sectionIndex}
          isExpanded={expandedSections.has(sectionIndex)}
          onToggleExpanded={toggleSectionExpanded}
          onUpdateSection={updateSection}
          onDeleteSection={deleteSection}
          onAddUnit={addUnit}
          onUpdateUnit={updateUnit}
          onDeleteUnit={deleteUnit}
          onVideoFileChange={handleVideoFileChange}
          onSectionImageUpdate={handleSectionImageUpdate}
        />
      ))}

      {sections.length === 0 && <EmptyState />}
    </div>
  );
};

export default SectionManager;
