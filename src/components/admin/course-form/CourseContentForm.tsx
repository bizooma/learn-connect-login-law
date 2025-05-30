
import SectionManager from "../SectionManager";

interface SectionData {
  id?: string;
  title: string;
  description: string;
  sort_order: number;
  units: UnitData[];
}

interface UnitData {
  id?: string;
  title: string;
  description: string;
  content: string;
  video_url: string;
  duration_minutes: number;
  sort_order: number;
}

interface CourseContentFormProps {
  sections: SectionData[];
  onSectionsChange: (sections: SectionData[]) => void;
}

const CourseContentForm = ({ sections, onSectionsChange }: CourseContentFormProps) => {
  return (
    <div className="space-y-4">
      <SectionManager
        sections={sections}
        onSectionsChange={onSectionsChange}
      />
    </div>
  );
};

export default CourseContentForm;
