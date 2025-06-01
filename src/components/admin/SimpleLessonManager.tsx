
import SimpleLessonManagerHeader from "./lesson-manager/SimpleLessonManagerHeader";
import { useLessonManager } from "./lesson-manager/useLessonManager";
import { SectionData } from "./lesson-manager/types";
import SimpleLessonCard from "./lesson-manager/SimpleLessonCard";
import EmptyState from "./lesson-manager/EmptyState";

interface SimpleLessonManagerProps {
  lessons: SectionData[];
  onLessonsChange: (lessons: SectionData[]) => void;
}

const SimpleLessonManager = ({ lessons, onLessonsChange }: SimpleLessonManagerProps) => {
  const lessonManagerProps = useLessonManager({ lessons, onLessonsChange });

  const handleAddLesson = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    lessonManagerProps.addLesson();
  };

  const handleAddUnit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (lessons.length === 0) {
      lessonManagerProps.addLesson();
      setTimeout(() => {
        if (!lessonManagerProps.expandedLessons.has(0)) {
          lessonManagerProps.toggleLessonExpanded(0);
        }
        lessonManagerProps.addUnit(0);
      }, 100);
    } else {
      if (!lessonManagerProps.expandedLessons.has(0)) {
        lessonManagerProps.toggleLessonExpanded(0);
      }
      lessonManagerProps.addUnit(0);
    }
  };

  const moveLessonUp = (index: number) => {
    if (index > 0) {
      lessonManagerProps.moveLessonToPosition(index, index - 1);
    }
  };

  const moveLessonDown = (index: number) => {
    if (index < lessons.length - 1) {
      lessonManagerProps.moveLessonToPosition(index, index + 1);
    }
  };

  const moveUnitUp = (lessonIndex: number, unitIndex: number) => {
    if (unitIndex > 0) {
      lessonManagerProps.moveUnitWithinLesson(lessonIndex, unitIndex, unitIndex - 1);
    }
  };

  const moveUnitDown = (lessonIndex: number, unitIndex: number) => {
    const lesson = lessons[lessonIndex];
    if (unitIndex < lesson.units.length - 1) {
      lessonManagerProps.moveUnitWithinLesson(lessonIndex, unitIndex, unitIndex + 1);
    }
  };

  return (
    <div className="space-y-4">
      <SimpleLessonManagerHeader
        onAddLesson={handleAddLesson}
        onAddUnit={handleAddUnit}
      />

      {lessons.map((lesson, lessonIndex) => (
        <SimpleLessonCard
          key={lessonIndex}
          lesson={lesson}
          lessonIndex={lessonIndex}
          isExpanded={lessonManagerProps.expandedLessons.has(lessonIndex)}
          onToggleExpanded={lessonManagerProps.toggleLessonExpanded}
          onUpdateLesson={lessonManagerProps.updateLesson}
          onDeleteLesson={lessonManagerProps.deleteLesson}
          onAddUnit={lessonManagerProps.addUnit}
          onUpdateUnit={lessonManagerProps.updateUnit}
          onDeleteUnit={lessonManagerProps.deleteUnit}
          onVideoFileChange={lessonManagerProps.handleVideoFileChange}
          onLessonImageUpdate={lessonManagerProps.handleLessonImageUpdate}
          onMoveLessonUp={() => moveLessonUp(lessonIndex)}
          onMoveLessonDown={() => moveLessonDown(lessonIndex)}
          onMoveUnitUp={moveUnitUp}
          onMoveUnitDown={moveUnitDown}
          onMoveUnitToLesson={lessonManagerProps.moveUnitToLesson}
          canMoveLessonUp={lessonIndex > 0}
          canMoveLessonDown={lessonIndex < lessons.length - 1}
          totalLessons={lessons.length}
        />
      ))}

      {lessons.length === 0 && <EmptyState />}
    </div>
  );
};

export default SimpleLessonManager;
