import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { Tables } from "@/integrations/supabase/types";

type Course = Tables<'courses'>;
type Level = Tables<'levels'>;

export const useCoursesData = () => {
  const { toast } = useToast();
  const { isAdmin } = useUserRole(); // Changed from hasAdminPrivileges to isAdmin
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
  }, [isAdmin]); // Changed from hasAdminPrivileges to isAdmin

  const fetchCourses = async () => {
    try {
      let query = supabase
        .from('courses')
        .select('*');

      // Filter out draft courses for non-admin users (only admins can see drafts)
      if (!isAdmin) {
        query = query.eq('is_draft', false);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

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

  const validCourseCategories = courses
    .map(course => course.category)
    .filter(category => category && category.trim() !== "");
  
  const categories = ["All", ...Array.from(new Set(validCourseCategories))];
  
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

  const clearFilters = () => {
    handleFilter("", "All", "All");
  };

  return {
    courses,
    filteredCourses,
    categories,
    levelOptions,
    searchTerm,
    selectedCategory,
    selectedLevel,
    loading,
    handleFilter,
    clearFilters
  };
};
