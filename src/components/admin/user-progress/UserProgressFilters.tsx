
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import UserProgressFilter from "./UserProgressFilter";

interface UserOption {
  id: string;
  name: string;
  email: string;
}

interface UserProgressFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedUserId: string;
  onUserChange: (userId: string) => void;
  courseFilter: string;
  onCourseChange: (courseId: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  users: UserOption[];
  courses: Array<{id: string, title: string}>;
}

const UserProgressFilters = ({
  searchTerm,
  onSearchChange,
  selectedUserId,
  onUserChange,
  courseFilter,
  onCourseChange,
  statusFilter,
  onStatusChange,
  users,
  courses
}: UserProgressFiltersProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by user name, email, or course..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <UserProgressFilter
            users={users}
            selectedUserId={selectedUserId}
            onUserChange={onUserChange}
          />
          
          <Select value={courseFilter} onValueChange={onCourseChange}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filter by course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map(course => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="not_started">Not Started</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserProgressFilters;
