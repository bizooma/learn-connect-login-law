
import { CourseWithContent } from "@/hooks/useLMSTreeData";

export const filterCourses = (courses: CourseWithContent[], searchTerm: string): CourseWithContent[] => {
  if (!searchTerm) return courses;
  
  const searchLower = searchTerm.toLowerCase();
  
  return courses.filter(course => {
    // Search in course title and description
    if (course.title?.toLowerCase().includes(searchLower) || 
        course.description?.toLowerCase().includes(searchLower)) {
      return true;
    }
    
    // Search in modules, lessons, and units
    return course.modules?.some(module => 
      module.title?.toLowerCase().includes(searchLower) ||
      module.description?.toLowerCase().includes(searchLower) ||
      module.lessons?.some(lesson =>
        lesson.title?.toLowerCase().includes(searchLower) ||
        lesson.description?.toLowerCase().includes(searchLower) ||
        lesson.units?.some(unit =>
          unit.title?.toLowerCase().includes(searchLower) ||
          unit.description?.toLowerCase().includes(searchLower)
        )
      )
    );
  });
};
