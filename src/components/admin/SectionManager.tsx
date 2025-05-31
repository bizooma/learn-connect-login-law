
import DragDropSectionManager from "./section-manager/DragDropSectionManager";
import { useSectionManager } from "./section-manager/useSectionManager";
import { SectionData } from "./section-manager/types";

interface SectionManagerProps {
  sections: SectionData[];
  onSectionsChange: (sections: SectionData[]) => void;
}

const SectionManager = ({ sections, onSectionsChange }: SectionManagerProps) => {
  const sectionManagerProps = useSectionManager({ sections, onSectionsChange });

  return (
    <DragDropSectionManager
      sections={sections}
      onSectionsChange={onSectionsChange}
      {...sectionManagerProps}
    />
  );
};

export default SectionManager;
