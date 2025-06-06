import { SectionData } from "../types";
import { uploadVideoFile } from "../../course-form/fileUploadUtils";

interface UseLessonOperationsProps {
  lessons: SectionData[];
  onLessonsChange: (lessons: SectionData[]) => void;
}

export const useLessonOperations = ({ lessons, onLessonsChange }: UseLessonOperationsProps) => {
  const addLesson = () => {
    const newLesson: SectionData = {
      title: `Lesson ${lessons.length + 1}`,
      description: '',
      image_url: '',
      video_url: '',
      video_type: 'youtube',
      duration_minutes: 0,
      sort_order: lessons.length,
      units: []
    };
    
    onLessonsChange([...lessons, newLesson]);
  };

  const updateLesson = (lessonIndex: number, field: keyof SectionData, value: any) => {
    const updatedLessons = lessons.map((lesson, index) => {
      if (index === lessonIndex) {
        return { ...lesson, [field]: value };
      }
      return lesson;
    });
    onLessonsChange(updatedLessons);
  };

  const deleteLesson = (lessonIndex: number) => {
    const updatedLessons = lessons.filter((_, index) => index !== lessonIndex);
    onLessonsChange(updatedLessons);
  };

  const handleLessonImageUpdate = (lessonIndex: number, imageUrl: string | null) => {
    updateLesson(lessonIndex, 'image_url', imageUrl || '');
  };

  const handleLessonVideoFileChange = async (lessonIndex: number, file: File | null) => {
    if (!file) {
      updateLesson(lessonIndex, 'video_file', null);
      return;
    }

    try {
      console.log('Uploading lesson video file...');
      const videoUrl = await uploadVideoFile(file);
      
      // Update both the video URL and set video type to 'upload'
      const updatedLessons = lessons.map((lesson, index) => {
        if (index === lessonIndex) {
          return { 
            ...lesson, 
            video_url: videoUrl,
            video_type: 'upload' as const,
            video_file: file
          };
        }
        return lesson;
      });
      
      onLessonsChange(updatedLessons);
      console.log('Lesson video uploaded successfully:', videoUrl);
    } catch (error) {
      console.error('Error uploading lesson video:', error);
      // Keep the file in state for retry
      updateLesson(lessonIndex, 'video_file', file);
    }
  };

  return {
    addLesson,
    updateLesson,
    deleteLesson,
    handleLessonImageUpdate,
    handleLessonVideoFileChange,
  };
};
