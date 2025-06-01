
import { useParams } from "react-router-dom";
import CourseHeader from "@/components/course/CourseHeader";
import CourseLoading from "@/components/course/CourseLoading";
import CourseNotFound from "@/components/course/CourseNotFound";
import CourseMainContent from "@/components/course/CourseMainContent";
import { useCourse } from "@/hooks/useCourse";

const Course = () => {
  const { id } = useParams<{ id: string }>();
  const { course, selectedUnit, setSelectedUnit, loading, isAdmin } = useCourse(id);

  if (loading) {
    return <CourseLoading />;
  }

  if (!course) {
    return <CourseNotFound />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CourseHeader course={course} />
      <CourseMainContent
        courseId={course.id}
        lessons={course.lessons}
        selectedUnit={selectedUnit}
        onUnitSelect={setSelectedUnit}
        isAdmin={isAdmin}
      />
    </div>
  );
};

export default Course;
