
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import AdminCourseCard from "./AdminCourseCard";
import CourseSearch from "./CourseSearch";
import CourseManagementLoading from "./CourseManagementLoading";
import CreateCourseForm from "./CreateCourseForm";
import EditCourseForm from "./EditCourseForm";
import { Tables } from "@/integrations/supabase/types";

type Course = Tables<'courses'>;

const CourseManagement = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: "Error",
        description: "Failed to fetch courses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteCourse = async (courseId: string) => {
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) {
        throw error;
      }

      setCourses(courses.filter(course => course.id !== courseId));
      toast({
        title: "Success",
        description: "Course deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        title: "Error",
        description: "Failed to delete course",
        variant: "destructive",
      });
    }
  };

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setEditFormOpen(true);
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <CourseManagementLoading />;
  }

  return (
    <div className="space-y-6">
      {/* Header with search and create button */}
      <div className="flex items-center justify-between">
        <CourseSearch 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
        <Button onClick={() => setCreateFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Course
        </Button>
      </div>

      {/* Courses grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCourses.map((course) => (
          <AdminCourseCard
            key={course.id}
            course={course}
            onDelete={deleteCourse}
            onEdit={handleEditCourse}
          />
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No courses found</p>
        </div>
      )}

      {/* Create Course Form */}
      <CreateCourseForm
        open={createFormOpen}
        onOpenChange={setCreateFormOpen}
        onCourseCreated={fetchCourses}
      />

      {/* Edit Course Form */}
      <EditCourseForm
        open={editFormOpen}
        onOpenChange={setEditFormOpen}
        course={selectedCourse}
        onCourseUpdated={fetchCourses}
      />
    </div>
  );
};

export default CourseManagement;
