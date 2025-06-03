
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface ActivityFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activityFilter: string;
  setActivityFilter: (filter: string) => void;
  dateFilter: string;
  setDateFilter: (filter: string) => void;
}

const ActivityFilters = ({
  searchTerm,
  setSearchTerm,
  activityFilter,
  setActivityFilter,
  dateFilter,
  setDateFilter
}: ActivityFiltersProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by user, course, or activity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={activityFilter} onValueChange={setActivityFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filter by activity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activities</SelectItem>
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="course_access">Course Access</SelectItem>
              <SelectItem value="unit_complete">Unit Complete</SelectItem>
              <SelectItem value="quiz_complete">Quiz Complete</SelectItem>
              <SelectItem value="video_complete">Video Complete</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="Time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">Last 30 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityFilters;
