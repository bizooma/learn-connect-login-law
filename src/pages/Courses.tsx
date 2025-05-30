
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CourseCard from "@/components/CourseCard";
import CourseFilters from "@/components/CourseFilters";

// Mock course data
const mockCourses = [
  {
    id: 1,
    title: "Constitutional Law Fundamentals",
    description: "Master the principles of constitutional law, including federal powers, individual rights, and judicial review.",
    instructor: "Prof. Sarah Johnson",
    duration: "12 weeks",
    level: "Beginner",
    category: "Constitutional Law",
    price: 299,
    rating: 4.8,
    studentsEnrolled: 1250,
    imageUrl: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=250&fit=crop",
    tags: ["Constitution", "Federal Law", "Rights"]
  },
  {
    id: 2,
    title: "Advanced Contract Law",
    description: "Deep dive into contract formation, interpretation, and enforcement in modern legal practice.",
    instructor: "Prof. Michael Chen",
    duration: "10 weeks",
    level: "Advanced",
    category: "Contract Law",
    price: 399,
    rating: 4.9,
    studentsEnrolled: 890,
    imageUrl: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=250&fit=crop",
    tags: ["Contracts", "Business Law", "Legal Practice"]
  },
  {
    id: 3,
    title: "Criminal Law Essentials",
    description: "Comprehensive overview of criminal law principles, procedures, and defense strategies.",
    instructor: "Prof. Elena Rodriguez",
    duration: "8 weeks",
    level: "Intermediate",
    category: "Criminal Law",
    price: 249,
    rating: 4.7,
    studentsEnrolled: 1100,
    imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=250&fit=crop",
    tags: ["Criminal Law", "Defense", "Procedures"]
  },
  {
    id: 4,
    title: "Corporate Law & Governance",
    description: "Understanding corporate structures, governance principles, and regulatory compliance.",
    instructor: "Prof. David Kim",
    duration: "14 weeks",
    level: "Advanced",
    category: "Corporate Law",
    price: 449,
    rating: 4.6,
    studentsEnrolled: 670,
    imageUrl: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=250&fit=crop",
    tags: ["Corporate", "Governance", "Compliance"]
  },
  {
    id: 5,
    title: "Legal Research Methods",
    description: "Master essential legal research skills using both traditional and digital resources.",
    instructor: "Prof. Lisa Thompson",
    duration: "6 weeks",
    level: "Beginner",
    category: "Legal Skills",
    price: 199,
    rating: 4.5,
    studentsEnrolled: 1450,
    imageUrl: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=400&h=250&fit=crop",
    tags: ["Research", "Legal Writing", "Skills"]
  },
  {
    id: 6,
    title: "Family Law Practice",
    description: "Navigate family law matters including divorce, custody, and domestic relations.",
    instructor: "Prof. Amanda Davis",
    duration: "9 weeks",
    level: "Intermediate",
    category: "Family Law",
    price: 329,
    rating: 4.8,
    studentsEnrolled: 820,
    imageUrl: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=400&h=250&fit=crop",
    tags: ["Family Law", "Divorce", "Custody"]
  }
];

const Courses = () => {
  const navigate = useNavigate();
  const [filteredCourses, setFilteredCourses] = useState(mockCourses);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");

  const categories = ["All", ...Array.from(new Set(mockCourses.map(course => course.category)))];
  const levels = ["All", "Beginner", "Intermediate", "Advanced"];

  const handleFilter = (search: string, category: string, level: string) => {
    setSearchTerm(search);
    setSelectedCategory(category);
    setSelectedLevel(level);

    let filtered = mockCourses;

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
            <div className="text-sm text-gray-500">
              {filteredCourses.length} courses available
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
