
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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const { data: coursesData, isLoading, error, refetch } = useQuery({
    queryKey: ['lms-tree-data'],
    queryFn: async () => {
      console.log('Fetching LMS tree data with modules...');
      
      // Fetch courses with modules, sections, units, and quizzes
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select(`
          *,
          modules (
            *,
            sections (
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

      // Sort modules, sections and units by sort_order
      const sortedData = courses?.map(course => ({
        ...course,
        modules: (course.modules || [])
          .sort((a, b) => a.sort_order - b.sort_order)
          .map(module => ({
            ...module,
            sections: (module.sections || [])
              .sort((a, b) => a.sort_order - b.sort_order)
              .map(section => ({
                ...section,
                units: (section.units || []).sort((a, b) => a.sort_order - b.sort_order)
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

  const toggleSectionExpanded = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const filteredCourses = coursesData?.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.modules?.some(module =>
      module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.sections?.some(section =>
        section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.units?.some(unit =>
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
        expandedSections={expandedSections}
        onToggleCourse={toggleCourseExpanded}
        onToggleModule={toggleModuleExpanded}
        onToggleSection={toggleSectionExpanded}
        onRefetch={refetch}
      />
    </div>
  );
};

export default LMSTree;
