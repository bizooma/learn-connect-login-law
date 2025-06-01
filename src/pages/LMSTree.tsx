
import LMSTreeHeader from "@/components/lms-tree/LMSTreeHeader";
import LMSTreeContent from "@/components/lms-tree/LMSTreeContent";
import LMSTreeLoading from "@/components/lms-tree/LMSTreeLoading";
import LMSTreeFooter from "@/components/lms-tree/LMSTreeFooter";
import { useLMSTreeState } from "@/hooks/useLMSTreeState";
import { useLMSTreeData } from "@/hooks/useLMSTreeData";
import { filterCourses } from "@/components/lms-tree/utils/courseFilter";

const LMSTree = () => {
  const {
    searchTerm,
    setSearchTerm,
    expandedCourses,
    expandedModules,
    expandedLessons,
    handleToggleCourse,
    handleToggleModule,
    handleToggleLesson,
  } = useLMSTreeState();

  const { courses, isLoading, refetch } = useLMSTreeData();

  // Filter courses based on search term
  const filteredCourses = filterCourses(courses, searchTerm);

  if (isLoading) {
    return <LMSTreeLoading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <LMSTreeHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        totalCourses={courses.length}
      />
      
      <div className="flex-1">
        <LMSTreeContent
          courses={filteredCourses}
          expandedCourses={expandedCourses}
          expandedModules={expandedModules}
          expandedLessons={expandedLessons}
          onToggleCourse={handleToggleCourse}
          onToggleModule={handleToggleModule}
          onToggleLesson={handleToggleLesson}
          onRefetch={refetch}
        />
      </div>
      
      <LMSTreeFooter />
    </div>
  );
};

export default LMSTree;
