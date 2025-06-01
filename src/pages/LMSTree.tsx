
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LMSTreeHeader from "@/components/lms-tree/LMSTreeHeader";
import LMSTreeContent from "@/components/lms-tree/LMSTreeContent";
import LMSTreeLoading from "@/components/lms-tree/LMSTreeLoading";

const LMSTree = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());

  const { data: coursesData, isLoading, error, refetch } = useQuery({
    queryKey: ['lms-tree-data'],
    queryFn: async () => {
      console.log('Fetching LMS tree data with modules...');
      
      // Fetch courses with modules, lessons, units, and quizzes
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select(`
          *,
          modules (
            *,
            lessons (
              *,
              units (
                *,
                quizzes (*)
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (coursesError) {
        console.error('Error fetching courses:', coursesError);
        throw coursesError;
      }

      // Sort modules, lessons and units by sort_order
      const sortedData = courses?.map(course => ({
        ...course,
        modules: (course.modules || [])
          .sort((a, b) => a.sort_order - b.sort_order)
          .map(module => ({
            ...module,
            lessons: (module.lessons || [])
              .sort((a, b) => a.sort_order - b.sort_order)
              .map(lesson => ({
                ...lesson,
                units: (lesson.units || []).sort((a, b) => a.sort_order - b.sort_order)
              }))
          }))
      })) || [];

      console.log('LMS tree data fetched:', sortedData);
      return sortedData;
    }
  });

  if (error) {
    toast({
      title: "Error",
      description: "Failed to load course data",
      variant: "destructive",
    });
  }

  const toggleCourseExpanded = (courseId: string) => {
    setExpandedCourses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }
      return newSet;
    });
  };

  const toggleModuleExpanded = (moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const toggleLessonExpanded = (lessonId: string) => {
    setExpandedLessons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(lessonId)) {
        newSet.delete(lessonId);
      } else {
        newSet.add(lessonId);
      }
      return newSet;
    });
  };

  const filteredCourses = coursesData?.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.modules?.some(module =>
      module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.lessons?.some(lesson =>
        lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson.units?.some(unit =>
          unit.title.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    )
  ) || [];

  if (isLoading) {
    return <LMSTreeLoading />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LMSTreeHeader 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        totalCourses={coursesData?.length || 0}
      />
      
      <LMSTreeContent
        courses={filteredCourses}
        expandedCourses={expandedCourses}
        expandedModules={expandedModules}
        expandedLessons={expandedLessons}
        onToggleCourse={toggleCourseExpanded}
        onToggleModule={toggleModuleExpanded}
        onToggleLesson={toggleLessonExpanded}
        onRefetch={refetch}
      />
    </div>
  );
};

export default LMSTree;
