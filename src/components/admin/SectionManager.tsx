
import SimpleSectionManager from "./SimpleSectionManager";
import { SectionData } from "./section-manager/types";

interface SectionManagerProps {
  sections: SectionData[];
  onSectionsChange: (sections: SectionData[]) => void;
}

const SectionManager = ({ sections, onSectionsChange }: SectionManagerProps) => {
  return (
    <SimpleSectionManager
      sections={sections}
      onSectionsChange={onSectionsChange}
    />
  );
};

export default SectionManager;
