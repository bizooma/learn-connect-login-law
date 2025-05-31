
import CourseFilters from "@/components/CourseFilters";
import NotificationBanner from "@/components/notifications/NotificationBanner";
import CoursesHeader from "@/components/courses/CoursesHeader";
import CoursesGrid from "@/components/courses/CoursesGrid";
import { useCoursesData } from "@/hooks/useCoursesData";

const Courses = () => {
  const {
    filteredCourses,
    categories,
    levelOptions,
    searchTerm,
    selectedCategory,
    selectedLevel,
    loading,
    handleFilter,
    clearFilters
  } = useCoursesData();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <CoursesHeader filteredCoursesCount={filteredCourses.length} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <NotificationBanner />

        <CourseFilters
          categories={categories}
          levels={levelOptions}
          onFilter={handleFilter}
          searchTerm={searchTerm}
          selectedCategory={selectedCategory}
          selectedLevel={selectedLevel}
        />

        <CoursesGrid 
          filteredCourses={filteredCourses}
          onClearFilters={clearFilters}
        />
      </div>
    </div>
  );
};

export default Courses;
