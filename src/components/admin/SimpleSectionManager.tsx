
import SimpleSectionManagerHeader from "./section-manager/SimpleSectionManagerHeader";
import { useSectionManager } from "./section-manager/useSectionManager";
import { SectionData } from "./section-manager/types";
import SimpleSectionCard from "./section-manager/SimpleSectionCard";
import EmptyState from "./section-manager/EmptyState";

interface SimpleSectionManagerProps {
  sections: SectionData[];
  onSectionsChange: (sections: SectionData[]) => void;
}

const SimpleSectionManager = ({ sections, onSectionsChange }: SimpleSectionManagerProps) => {
  const sectionManagerProps = useSectionManager({ sections, onSectionsChange });

  const handleAddSection = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    sectionManagerProps.addSection();
  };

  const handleAddUnit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (sections.length === 0) {
      sectionManagerProps.addSection();
      setTimeout(() => {
        if (!sectionManagerProps.expandedSections.has(0)) {
          sectionManagerProps.toggleSectionExpanded(0);
        }
        sectionManagerProps.addUnit(0);
      }, 100);
    } else {
      if (!sectionManagerProps.expandedSections.has(0)) {
        sectionManagerProps.toggleSectionExpanded(0);
      }
      sectionManagerProps.addUnit(0);
    }
  };

  const moveSectionUp = (index: number) => {
    if (index > 0) {
      sectionManagerProps.moveSectionToPosition(index, index - 1);
    }
  };

  const moveSectionDown = (index: number) => {
    if (index < sections.length - 1) {
      sectionManagerProps.moveSectionToPosition(index, index + 1);
    }
  };

  const moveUnitUp = (sectionIndex: number, unitIndex: number) => {
    if (unitIndex > 0) {
      sectionManagerProps.moveUnitWithinSection(sectionIndex, unitIndex, unitIndex - 1);
    }
  };

  const moveUnitDown = (sectionIndex: number, unitIndex: number) => {
    const section = sections[sectionIndex];
    if (unitIndex < section.units.length - 1) {
      sectionManagerProps.moveUnitWithinSection(sectionIndex, unitIndex, unitIndex + 1);
    }
  };

  return (
    <div className="space-y-4">
      <SimpleSectionManagerHeader
        onAddSection={handleAddSection}
        onAddUnit={handleAddUnit}
      />

      {sections.map((section, sectionIndex) => (
        <SimpleSectionCard
          key={sectionIndex}
          section={section}
          sectionIndex={sectionIndex}
          isExpanded={sectionManagerProps.expandedSections.has(sectionIndex)}
          onToggleExpanded={() => sectionManagerProps.toggleSectionExpanded(sectionIndex)}
          onUpdate={(field, value) => sectionManagerProps.updateSection(sectionIndex, field, value)}
          onDelete={() => sectionManagerProps.deleteSection(sectionIndex)}
          onAddUnit={() => sectionManagerProps.addUnit(sectionIndex)}
          onUpdateUnit={(unitIndex, field, value) => sectionManagerProps.updateUnit(sectionIndex, unitIndex, field, value)}
          onDeleteUnit={(unitIndex) => sectionManagerProps.deleteUnit(sectionIndex, unitIndex)}
          onVideoFileChange={(unitIndex, file) => sectionManagerProps.handleVideoFileChange(sectionIndex, unitIndex, file)}
        />
      ))}

      {sections.length === 0 && <EmptyState />}
    </div>
  );
};

export default SimpleSectionManager;
