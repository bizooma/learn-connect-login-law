
import { useState, useEffect } from "react";
import { SectionData } from "../types";
import { Tables } from "@/integrations/supabase/types";
import { fetchCourseContent } from "../services/courseContentFetcher";

type Course = Tables<'courses'>;

export const useCourseContentManagement = (course: Course | null, open: boolean) => {
  const [sections, setSections] = useState<SectionData[]>([]);

  useEffect(() => {
    if (course && open) {
      fetchCourseContent(course.id).then(setSections);
    }
  }, [course, open]);

  return {
    sections,
    setSections,
  };
};
