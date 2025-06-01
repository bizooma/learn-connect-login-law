
import SimpleLessonManager from "./SimpleLessonManager";
import { SectionData } from "./lesson-manager/types";

interface LessonManagerProps {
  lessons: SectionData[];
  onLessonsChange: (lessons: SectionData[]) => void;
}

const LessonManager = ({ lessons, onLessonsChange }: LessonManagerProps) => {
  return (
    <SimpleLessonManager
      lessons={lessons}
      onLessonsChange={onLessonsChange}
    />
  );
};

export default LessonManager;
