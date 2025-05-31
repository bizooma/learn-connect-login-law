import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CourseCard from "@/components/CourseCard";
import CourseFilters from "@/components/CourseFilters";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import NotificationBanner from "@/components/notifications/NotificationBanner";

type Course = Tables<'courses'>;
type Level = Tables<'levels'>;

const Courses = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
    fetchLevels();
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

  const fetchLevels = async () => {
    try {
      const { data, error } = await supabase
        .from('levels')
        .select('*')
        .order('category', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) {
        throw error;
      }

      setLevels(data || []);
    } catch (error) {
      console.error('Error fetching levels:', error);
    }
  };

  // Filter out empty/null categories and ensure unique valid values
  const validCourseCategories = courses
    .map(course => course.category)
    .filter(category => category && category.trim() !== "");
  
  const categories = ["All", ...Array.from(new Set(validCourseCategories))];
  
  // Create level options from the levels table, filtering out empty codes
  const validLevelCodes = levels
    .map(level => level.code)
    .filter(code => code && code.trim() !== "");
    
  const levelOptions = ["All", ...validLevelCodes];

  const handleFilter = (search: string, category: string, level: string) => {
    setSearchTerm(search);
    setSelectedCategory(category);
    setSelectedLevel(level);

    let filtered = courses;

    if (search) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(search.toLowerCase()) ||
        (course.description && course.description.toLowerCase().includes(search.toLowerCase())) ||
        (course.tags && course.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase())))
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
      <div className="shadow-sm" style={{ backgroundColor: '#213C82' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                className="hover:bg-white/10 text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-white">Course Catalog</h1>
                <p className="text-white/90 mt-1">
                  Discover comprehensive legal education courses
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="flex items-center border-white/20 text-white hover:bg-white/10"
              >
                <Home className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="text-sm text-white/80">
                {filteredCourses.length} courses available
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Notification Banner */}
        <NotificationBanner />

        {/* Filters */}
        <CourseFilters
          categories={categories}
          levels={levelOptions}
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
