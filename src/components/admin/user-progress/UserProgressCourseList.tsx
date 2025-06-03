
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CourseProgressCard from "./CourseProgressCard";

interface Course {
  course_id: string;
  course_title: string;
  status: string;
  progress_percentage: number;
  started_at: string | null;
  completed_at: string | null;
  last_accessed_at: string | null;
  completed_units: number;
  total_units: number;
}

interface UserProgressCourseListProps {
  courses: Course[];
  onDeleteCourse: (courseId: string) => void;
}

const UserProgressCourseList = ({ courses, onDeleteCourse }: UserProgressCourseListProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Course Progress Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {courses.map((course, index) => (
            <CourseProgressCard
              key={index}
              course={course}
              onDelete={onDeleteCourse}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserProgressCourseList;
