import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, X } from "lucide-react";
import { useGroups } from "@/hooks/useGroups";
import { UserFilters, emptyFilters, hasActiveFilters } from "./userRoleUtils";

interface UserFiltersBarProps {
  filters: UserFilters;
  onChange: (f: UserFilters) => void;
  totalUsers: number;
  filteredCount: number;
  allSelected: boolean;
  someSelected: boolean;
  onToggleSelectAll: () => void;
}

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "owner", label: "Owner" },
  { value: "team_leader", label: "Team Leader" },
  { value: "student", label: "Student" },
  { value: "client", label: "Client" },
  { value: "free", label: "Free" },
];

const UserFiltersBar = ({
  filters,
  onChange,
  totalUsers,
  filteredCount,
  allSelected,
  someSelected,
  onToggleSelectAll,
}: UserFiltersBarProps) => {
  const { groups } = useGroups();

  const toggleRole = (value: string) => {
    onChange({
      ...filters,
      roles: filters.roles.includes(value)
        ? filters.roles.filter((r) => r !== value)
        : [...filters.roles, value],
    });
  };

  const toggleGroup = (id: string) => {
    onChange({
      ...filters,
      groupIds: filters.groupIds.includes(id)
        ? filters.groupIds.filter((g) => g !== id)
        : [...filters.groupIds, id],
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 border border-border rounded-lg bg-muted/30">
      <label className="flex items-center gap-2 pl-1 pr-3 border-r border-border">
        <Checkbox
          checked={allSelected ? true : someSelected ? "indeterminate" : false}
          onCheckedChange={onToggleSelectAll}
        />
        <span className="text-xs text-muted-foreground">Select page</span>
      </label>

      {/* Role */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            Role
            {filters.roles.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                {filters.roles.length}
              </Badge>
            )}
            <ChevronDown className="h-3.5 w-3.5 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel>Filter by role</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {ROLE_OPTIONS.map((r) => (
            <DropdownMenuCheckboxItem
              key={r.value}
              checked={filters.roles.includes(r.value)}
              onCheckedChange={() => toggleRole(r.value)}
            >
              {r.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Tester */}
      <Select
        value={filters.tester}
        onValueChange={(v) => onChange({ ...filters, tester: v as UserFilters["tester"] })}
      >
        <SelectTrigger className="h-8 w-[130px]">
          <SelectValue placeholder="Tester" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Tester: Any</SelectItem>
          <SelectItem value="yes">Tester: Yes</SelectItem>
          <SelectItem value="no">Tester: No</SelectItem>
        </SelectContent>
      </Select>

      {/* Group */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            Group
            {filters.groupIds.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                {filters.groupIds.length}
              </Badge>
            )}
            <ChevronDown className="h-3.5 w-3.5 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 max-h-72 overflow-auto">
          <DropdownMenuLabel>Filter by group</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {groups.length === 0 && (
            <div className="px-3 py-2 text-xs text-muted-foreground">No groups</div>
          )}
          {groups.map((g) => (
            <DropdownMenuCheckboxItem
              key={g.id}
              checked={filters.groupIds.includes(g.id)}
              onCheckedChange={() => toggleGroup(g.id)}
            >
              {g.name}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Activity */}
      <Select
        value={filters.activity}
        onValueChange={(v) => onChange({ ...filters, activity: v as UserFilters["activity"] })}
      >
        <SelectTrigger className="h-8 w-[160px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Activity: Any</SelectItem>
          <SelectItem value="7d">Active last 7 days</SelectItem>
          <SelectItem value="30d">Active last 30 days</SelectItem>
          <SelectItem value="90d">Active last 90 days</SelectItem>
          <SelectItem value="never">Never signed in</SelectItem>
        </SelectContent>
      </Select>

      {/* Assignment */}
      <Select
        value={filters.assignment}
        onValueChange={(v) =>
          onChange({ ...filters, assignment: v as UserFilters["assignment"] })
        }
      >
        <SelectTrigger className="h-8 w-[170px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Assignment: Any</SelectItem>
          <SelectItem value="no_group">No group</SelectItem>
          <SelectItem value="no_course">No course assigned</SelectItem>
        </SelectContent>
      </Select>

      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          Showing {filteredCount} of {totalUsers}
        </span>
        {hasActiveFilters(filters) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onChange(emptyFilters)}
          >
            <X className="h-3 w-3 mr-1" /> Clear
          </Button>
        )}
      </div>
    </div>
  );
};

export default UserFiltersBar;
