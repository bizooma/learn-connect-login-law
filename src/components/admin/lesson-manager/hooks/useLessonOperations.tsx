
import { SectionData } from "../types";

interface UseLessonOperationsProps {
  lessons: SectionData[];
  onLessonsChange: (lessons: SectionData[]) => void;
}

export const useLessonOperations = ({ lessons, onLessonsChange }: UseLessonOperationsProps) => {
  const addLesson = () => {
    const newLesson: SectionData = {
      title: "",
      description: "",
      image_url: "",
      sort_order: lessons.length,
      units: []
    };
    onLessonsChange([...lessons, newLesson]);
  };

  const updateLesson = (index: number, field: keyof SectionData, value: any) => {
    const updatedLessons = lessons.map((lesson, i) => 
      i === index ? { ...lesson, [field]: value } : lesson
    );
    onLessonsChange(updatedLessons);
  };

  const deleteLesson = (index: number) => {
    const updatedLessons = lessons.filter((_, i) => i !== index);
    // Update sort orders
    const reorderedLessons = updatedLessons.map((lesson, i) => ({
      ...lesson,
      sort_order: i
    }));
    onLessonsChange(reorderedLessons);
  };

  const handleLessonImageUpdate = (lessonIndex: number, imageUrl: string | null) => {
    updateLesson(lessonIndex, 'image_url', imageUrl || '');
  };

  return {
    addLesson,
    updateLesson,
    deleteLesson,
    handleLessonImageUpdate,
  };
};
