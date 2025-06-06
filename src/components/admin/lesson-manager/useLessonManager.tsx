
import { SectionData } from "./types";
import { useLessonOperations } from "./hooks/useLessonOperations";
import { useUnitOperations } from "./hooks/useUnitOperations";
import { useMovementOperations } from "./hooks/useMovementOperations";
import { useUIState } from "./hooks/useUIState";

interface UseLessonManagerProps {
  lessons: SectionData[];
  onLessonsChange: (lessons: SectionData[]) => void;
}

export const useLessonManager = ({ lessons, onLessonsChange }: UseLessonManagerProps) => {
  const { expandedLessons, toggleLessonExpanded } = useUIState();
  
  const {
    addLesson,
    updateLesson,
    deleteLesson,
    handleLessonImageUpdate,
    handleLessonVideoFileChange,
  } = useLessonOperations({ lessons, onLessonsChange });

  const {
    addUnit,
    updateUnit,
    deleteUnit,
    handleVideoFileChange,
  } = useUnitOperations({ lessons, onLessonsChange });

  const {
    moveLessonToPosition,
    moveUnitWithinLesson,
    moveUnitToLesson,
  } = useMovementOperations({ lessons, onLessonsChange });

  return {
    expandedLessons,
    addLesson,
    updateLesson,
    deleteLesson,
    addUnit,
    updateUnit,
    deleteUnit,
    toggleLessonExpanded,
    handleVideoFileChange,
    handleLessonImageUpdate,
    handleLessonVideoFileChange,
    moveLessonToPosition,
    moveUnitWithinLesson,
    moveUnitToLesson,
  };
};
