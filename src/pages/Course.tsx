
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Play, Clock, Users, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { getLevelColor, getLevelDisplayName } from "@/utils/courseUtils";
import CourseVideo from "@/components/course/CourseVideo";
import CourseContent from "@/components/course/CourseContent";
import CourseSidebar from "@/components/course/CourseSidebar";
import CourseCalendar from "@/components/course/CourseCalendar";

type Course = Tables<'courses'>;
type Section = Tables<'sections'>;
type Unit = Tables<'units'>;

interface CourseWithContent extends Course {
  sections: (Section & {
    units: Unit[];
  })[];
}

const Course = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [course, setCourse] = useState<CourseWithContent | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCourse();
      checkAdminStatus();
    }
  }, [id]);

  const checkAdminStatus = async () => {
    try {
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
      
      setIsAdmin(userRoles?.some(role => role.role === 'admin' || role.role === 'owner') || false);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const fetchCourse = async () => {
    try {
      // Fetch course with sections and units
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (courseError) throw courseError;

      // Fetch sections with units
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('sections')
        .select(`
          *,
          units (*)
        `)
        .eq('course_id', id)
        .order('sort_order', { ascending: true });

      if (sectionsError) throw sectionsError;

      // Sort units within each section
      const sectionsWithSortedUnits = sectionsData.map(section => ({
        ...section,
        units: section.units.sort((a, b) => a.sort_order - b.sort_order)
      }));

      const courseWithContent: CourseWithContent = {
        ...courseData,
        sections: sectionsWithSortedUnits
      };

      setCourse(courseWithContent);

      // Set first unit as selected by default
      if (sectionsWithSortedUnits.length > 0 && sectionsWithSortedUnits[0].units.length > 0) {
        setSelectedUnit(sectionsWithSortedUnits[0].units[0]);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      toast({
        title: "Error",
        description: "Failed to load course",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Course not found</h2>
          <Button onClick={() => navigate("/courses")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/courses")}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Button>
            <div className="flex items-center space-x-4">
              <Badge className={getLevelColor(course.level)}>
                {getLevelDisplayName(course.level)}
              </Badge>
              <div className="flex items-center text-sm text-gray-500">
                <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                {course.rating || 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>
              <p className="text-gray-600 mb-6">{course.description}</p>
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  {course.students_enrolled || 0} students
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  {course.duration}
                </div>
                <div>
                  Instructor: <span className="font-medium text-gray-900">{course.instructor}</span>
                </div>
              </div>
            </div>
            <div className="lg:col-span-1">
              {course.image_url && (
                <img
                  src={course.image_url}
                  alt={course.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <CourseSidebar
              sections={course.sections}
              selectedUnit={selectedUnit}
              onUnitSelect={setSelectedUnit}
            />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="video" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="video">Video</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
              </TabsList>

              <TabsContent value="video" className="mt-6">
                <CourseVideo unit={selectedUnit} />
              </TabsContent>

              <TabsContent value="content" className="mt-6">
                <CourseContent unit={selectedUnit} />
              </TabsContent>

              <TabsContent value="calendar" className="mt-6">
                <CourseCalendar courseId={course.id} isAdmin={isAdmin} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Course;
