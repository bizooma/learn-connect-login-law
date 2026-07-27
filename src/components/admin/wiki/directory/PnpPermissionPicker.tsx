import { Check, Lock, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  PnpLevel,
  PNP_LEVEL_OPTIONS,
  useSetWikiPermission,
} from "@/hooks/useWikiPermission";

interface Props {
  userId: string;
  level: PnpLevel;
  /** True when the level is derived from the LMS role (admin/owner) and can't be edited here. */
  locked?: boolean;
  disabled?: boolean;
}

const styleFor = (level: PnpLevel): string => {
  switch (level) {
    case "admin":
      return "bg-[#213C82] text-white hover:bg-[#213C82]/90";
    case "author":
      return "bg-purple-100 text-purple-800 hover:bg-purple-100 dark:bg-purple-950 dark:text-purple-200";
    case "contributor":
      return "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-200";
    case "general":
    default:
      return "bg-muted text-foreground hover:bg-muted";
  }
};

const labelFor = (level: PnpLevel) =>
  PNP_LEVEL_OPTIONS.find((o) => o.value === level)?.label ?? "General";

const PnpPermissionPicker = ({ userId, level, locked, disabled }: Props) => {
  const setPerm = useSetWikiPermission();

  if (locked) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="secondary"
            className={`gap-1 cursor-default ${styleFor("admin")}`}
          >
            <Lock className="h-3 w-3" />
            Admin (LMS)
          </Badge>
        </TooltipTrigger>
        <TooltipContent>Inherited from LMS role — manage in User Management.</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled || setPerm.isPending}>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center"
        >
          <Badge variant="secondary" className={`gap-1 cursor-pointer ${styleFor(level)}`}>
            {labelFor(level)}
            <ChevronDown className="h-3 w-3" />
          </Badge>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-80"
        onClick={(e) => e.stopPropagation()}
      >
        {PNP_LEVEL_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            className="items-start gap-2 py-2.5"
            onSelect={() => {
              if (opt.value !== level) {
                setPerm.mutate({ userId, level: opt.value });
              }
            }}
          >
            <div className="flex-1">
              <div className="font-medium text-foreground">{opt.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {opt.description}
              </div>
            </div>
            {opt.value === level && (
              <Check className="h-4 w-4 text-primary shrink-0 mt-1" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PnpPermissionPicker;
