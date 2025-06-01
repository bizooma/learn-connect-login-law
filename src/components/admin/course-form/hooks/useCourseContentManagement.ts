
import { useState, useEffect } from "react";
import { SectionData } from "../types";
import { Tables } from "@/integrations/supabase/types";
import { fetchCourseContent } from "../services/courseContentFetcher";

type Course = Tables<'courses'>;

export const useCourseContentManagement = (course: Course | null, open: boolean) => {
  const [lessons, setLessons] = useState<SectionData[]>([]);

  useEffect(() => {
    if (course && open) {
      fetchCourseContent(course.id).then(setLessons);
    }
  }, [course, open]);

  return {
    lessons,
    setLessons,
  };
};
