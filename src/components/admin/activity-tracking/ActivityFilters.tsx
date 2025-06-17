
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, Download } from "lucide-react";
import TimeFilterPresets from "./TimeFilterPresets";
import type { ActivityFilters } from "./types";

interface ActivityFiltersProps {
  filters: ActivityFilters;
  onFiltersChange: (filters: ActivityFilters) => void;
  onExportCSV: () => void;
  loading?: boolean;
}

const ActivityFiltersComponent = ({ 
  filters, 
  onFiltersChange, 
  onExportCSV,
  loading = false 
}: ActivityFiltersProps) => {
  const [localFilters, setLocalFilters] = useState<ActivityFilters>(filters);

  const handleFilterChange = (key: keyof ActivityFilters, value: string | undefined) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const handlePresetSelect = (startDate: string, endDate?: string) => {
    const newFilters = { 
      ...localFilters, 
      startDate: startDate || undefined, 
      endDate: endDate || undefined 
    };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
  };

  const clearFilters = () => {
    const clearedFilters: ActivityFilters = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const quickSessionTypeFilter = (sessionType: string) => {
    const newFilters = { ...localFilters, sessionType: sessionType === 'all' ? undefined : sessionType };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Filter className="h-5 w-5" />
          <span>Activity Filters</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Time Filter Presets */}
        <TimeFilterPresets onPresetSelect={handlePresetSelect} />
        
        {/* Quick Session Type Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-600 mr-2">Session types:</span>
          {['all', 'general', 'course', 'unit'].map((type) => (
            <Button
              key={type}
              variant={localFilters.sessionType === type || (type === 'all' && !localFilters.sessionType) ? "default" : "outline"}
              size="sm"
              onClick={() => quickSessionTypeFilter(type)}
              className="text-xs capitalize"
            >
              {type}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={localFilters.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="end-date">End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={localFilters.endDate || ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="session-type">Session Type</Label>
            <Select 
              value={localFilters.sessionType || ''} 
              onValueChange={(value) => handleFilterChange('sessionType', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="course">Course</SelectItem>
                <SelectItem value="unit">Unit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="search"
                placeholder="Search users, courses..."
                value={localFilters.searchTerm || ''}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button onClick={applyFilters} disabled={loading}>
            <Filter className="h-4 w-4 mr-2" />
            Apply Filters
          </Button>
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
          <Button variant="outline" onClick={onExportCSV} disabled={loading}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityFiltersComponent;
