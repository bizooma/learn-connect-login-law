
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, X } from "lucide-react";

interface CourseFiltersProps {
  categories: string[];
  levels: string[];
  onFilter: (search: string, category: string, level: string) => void;
  searchTerm: string;
  selectedCategory: string;
  selectedLevel: string;
}

const CourseFilters = ({
  categories,
  levels,
  onFilter,
  searchTerm,
  selectedCategory,
  selectedLevel,
}: CourseFiltersProps) => {
  const handleSearchChange = (value: string) => {
    onFilter(value, selectedCategory, selectedLevel);
  };

  const handleCategoryChange = (value: string) => {
    onFilter(searchTerm, value, selectedLevel);
  };

  const handleLevelChange = (value: string) => {
    onFilter(searchTerm, selectedCategory, value);
  };

  const clearFilters = () => {
    onFilter("", "All", "All");
  };

  const hasActiveFilters = searchTerm || selectedCategory !== "All" || selectedLevel !== "All";

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border">
      <div className="flex items-center mb-4">
        <Filter className="h-5 w-5 text-gray-500 mr-2" />
        <h2 className="text-lg font-semibold text-gray-900">Filter Courses</h2>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="ml-auto text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4 mr-1" />
            Clear Filters
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filter */}
        <Select value={selectedCategory} onValueChange={handleCategoryChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Level Filter */}
        <Select value={selectedLevel} onValueChange={handleLevelChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select level" />
          </SelectTrigger>
          <SelectContent>
            {levels.map((level) => (
              <SelectItem key={level} value={level}>
                {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default CourseFilters;
