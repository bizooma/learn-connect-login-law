
import { Button } from "@/components/ui/button";
import CourseCard from "@/components/CourseCard";
import { Tables } from "@/integrations/supabase/types";

type Course = Tables<'courses'>;

interface CourseWithEnrollment extends Course {
  actual_enrollment_count?: number;
}

interface CoursesGridProps {
  filteredCourses: CourseWithEnrollment[];
  onClearFilters: () => void;
}

const CoursesGrid = ({ filteredCourses, onClearFilters }: CoursesGridProps) => {
  return (
    <>
      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {filteredCourses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">No courses found matching your criteria.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={onClearFilters}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </>
  );
};

export default CoursesGrid;
