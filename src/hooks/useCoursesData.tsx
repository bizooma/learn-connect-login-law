import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useEnrollmentCounts } from "@/hooks/useEnrollmentCounts";
import { Tables } from "@/integrations/supabase/types";

type Course = Tables<'courses'>;
type Level = Tables<'levels'>;

interface CourseWithEnrollment extends Course {
  actual_enrollment_count: number;
}

export const useCoursesData = () => {
  const { toast } = useToast();
  const { isAdmin } = useUserRole();
  const { enrollmentCounts } = useEnrollmentCounts();
  const [courses, setCourses] = useState<CourseWithEnrollment[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<CourseWithEnrollment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
    fetchLevels();
  }, [isAdmin]);

  // Update courses with enrollment counts when enrollmentCounts changes
  useEffect(() => {
    if (courses.length > 0) {
      const updatedCourses = courses.map(course => ({
        ...course,
        actual_enrollment_count: enrollmentCounts[course.id] || 0
      }));
      setCourses(updatedCourses);
      
      // Also update filtered courses
      const updatedFilteredCourses = filteredCourses.map(course => ({
        ...course,
        actual_enrollment_count: enrollmentCounts[course.id] || 0
      }));
      setFilteredCourses(updatedFilteredCourses);
    }
  }, [enrollmentCounts]);

  const sortCourses = (coursesToSort: CourseWithEnrollment[]) => {
    try {
      return coursesToSort.sort((a, b) => {
        // First, sort by category (Legal first, then Sales)
        const categoryOrder = { 'Legal': 1, 'Sales': 2 };
        const aCategoryOrder = categoryOrder[a.category as keyof typeof categoryOrder] || 999;
        const bCategoryOrder = categoryOrder[b.category as keyof typeof categoryOrder] || 999;
        
        if (aCategoryOrder !== bCategoryOrder) {
          return aCategoryOrder - bCategoryOrder;
        }
        
        // Then sort by level (100, 200, 300) - now with safe null handling
        const getLevelNumber = (level: string | null | undefined) => {
          // Handle null, undefined, or empty values safely
          if (!level || typeof level !== 'string') return 999;
          
          if (level.includes('100')) return 1;
          if (level.includes('200')) return 2;
          if (level.includes('300')) return 3;
          return 999;
        };
        
        const aLevelOrder = getLevelNumber(a.level);
        const bLevelOrder = getLevelNumber(b.level);
        
        return aLevelOrder - bLevelOrder;
      });
    } catch (error) {
      console.error('Error sorting courses:', error);
      // Fallback to basic sorting if level-based sorting fails
      return coursesToSort.sort((a, b) => a.title.localeCompare(b.title));
    }
  };

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

      // Remove any potential duplicates by id
      const uniqueCourses = data ? data.filter((course, index, self) => 
        index === self.findIndex(c => c.id === course.id)
      ) : [];

      // Add enrollment counts
      const coursesWithEnrollment: CourseWithEnrollment[] = uniqueCourses.map(course => ({
        ...course,
        actual_enrollment_count: enrollmentCounts[course.id] || 0
      }));

      const sortedData = sortCourses(coursesWithEnrollment);
      setCourses(sortedData);
      setFilteredCourses(sortedData);
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

    // Apply the same sorting to filtered results
    const sortedFiltered = sortCourses(filtered);
    setFilteredCourses(sortedFiltered);
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
