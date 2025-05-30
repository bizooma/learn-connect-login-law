
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CourseCard from "@/components/CourseCard";
import CourseFilters from "@/components/CourseFilters";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  duration: string;
  level: string;
  category: string;
  rating: number;
  students_enrolled: number;
  image_url: string;
  tags: string[];
}

const Courses = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      // Use type assertion since courses table isn't in the generated types yet
      const { data, error } = await (supabase as any)
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setCourses(data || []);
      setFilteredCourses(data || []);
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

  const categories = ["All", ...Array.from(new Set(courses.map(course => course.category)))];
  const levels = ["All", "Beginner", "Intermediate", "Advanced"];

  const handleFilter = (search: string, category: string, level: string) => {
    setSearchTerm(search);
    setSelectedCategory(category);
    setSelectedLevel(level);

    let filtered = courses;

    if (search) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(search.toLowerCase()) ||
        course.description.toLowerCase().includes(search.toLowerCase()) ||
        course.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
      );
    }

    if (category !== "All") {
      filtered = filtered.filter(course => course.category === category);
    }

    if (level !== "All") {
      filtered = filtered.filter(course => course.level === level);
    }

    setFilteredCourses(filtered);
  };

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
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                className="hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Course Catalog</h1>
                <p className="text-gray-600 mt-1">
                  Discover comprehensive legal education courses
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Course
              </Button>
              <div className="text-sm text-gray-500">
                {filteredCourses.length} courses available
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <CourseFilters
          categories={categories}
          levels={levels}
          onFilter={handleFilter}
          searchTerm={searchTerm}
          selectedCategory={selectedCategory}
          selectedLevel={selectedLevel}
        />

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
              onClick={() => handleFilter("", "All", "All")}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;
