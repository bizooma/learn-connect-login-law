
import { SectionData } from "../types";

interface UseMovementOperationsProps {
  lessons: SectionData[];
  onLessonsChange: (lessons: SectionData[]) => void;
}

export const useMovementOperations = ({ lessons, onLessonsChange }: UseMovementOperationsProps) => {
  const moveLessonToPosition = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    const newLessons = [...lessons];
    const [movedLesson] = newLessons.splice(fromIndex, 1);
    newLessons.splice(toIndex, 0, movedLesson);
    
    // Update sort orders to match the new positions
    const reorderedLessons = newLessons.map((lesson, index) => ({
      ...lesson,
      sort_order: index
    }));
    
    console.log('Moving lesson from', fromIndex, 'to', toIndex);
    console.log('Reordered lessons:', reorderedLessons.map(l => ({ title: l.title, sort_order: l.sort_order })));
    
    onLessonsChange(reorderedLessons);
  };

  const moveUnitWithinLesson = (lessonIndex: number, fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    const newLessons = [...lessons];
    const [movedUnit] = newLessons[lessonIndex].units.splice(fromIndex, 1);
    newLessons[lessonIndex].units.splice(toIndex, 0, movedUnit);
    
    // Update sort orders for units within the lesson
    newLessons[lessonIndex].units = newLessons[lessonIndex].units.map((unit, index) => ({
      ...unit,
      sort_order: index
    }));
    
    onLessonsChange(newLessons);
  };

  const moveUnitToLesson = (fromLessonIndex: number, unitIndex: number, toLessonIndex: number) => {
    const newLessons = [...lessons];
    
    // Remove unit from source lesson
    const [movedUnit] = newLessons[fromLessonIndex].units.splice(unitIndex, 1);
    
    // Add unit to target lesson
    newLessons[toLessonIndex].units.push(movedUnit);
    
    // Update sort orders for both lessons
    newLessons[fromLessonIndex].units = newLessons[fromLessonIndex].units.map((unit, index) => ({
      ...unit,
      sort_order: index
    }));
    
    newLessons[toLessonIndex].units = newLessons[toLessonIndex].units.map((unit, index) => ({
      ...unit,
      sort_order: index
    }));
    
    onLessonsChange(newLessons);
  };

  return {
    moveLessonToPosition,
    moveUnitWithinLesson,
    moveUnitToLesson,
  };
};
