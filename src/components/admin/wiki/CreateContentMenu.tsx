import { ChevronDown, FileText, GitBranch, Video, FileUp, ListChecks, ClipboardCheck, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { WikiContentType } from "@/hooks/useWikiArticles";

export type CreateContentChoice = WikiContentType | "subject";

interface Option {
  id: CreateContentChoice;
  title: string;
  description: string;
  Icon: typeof FileText;
}

const OPTIONS: Option[] = [
  { id: "document", title: "Document", description: "Write with AI, utilizing visuals like images, tables and GIFs.", Icon: FileText },
  { id: "flowchart", title: "Flowchart", description: "Visually diagram processes that connect people, groups and content.", Icon: GitBranch },
  { id: "video", title: "Video", description: "Upload or link a video.", Icon: Video },
  { id: "file", title: "File", description: "Bring in existing files like PDF, DOC, PPT, XLS, SCORM and more.", Icon: FileUp },
  { id: "checklist", title: "Checklist", description: "Create lightweight checklists for everyday processes.", Icon: ListChecks },
  { id: "test", title: "Test", description: "Build a quiz to check knowledge and comprehension.", Icon: ClipboardCheck },
  { id: "subject", title: "Subject", description: "Create a folder for your courses, videos, flowcharts, tests and more.", Icon: FolderPlus },
];

interface CreateContentMenuProps {
  onSelect: (choice: CreateContentChoice) => void;
}

const CreateContentMenu = ({ onSelect }: CreateContentMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="gap-1">
          Create <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px] p-1">
        {OPTIONS.map(({ id, title, description, Icon }) => (
          <DropdownMenuItem
            key={id}
            onClick={() => onSelect(id)}
            className="flex items-start gap-3 p-3 cursor-pointer"
          >
            <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4 text-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground">{title}</div>
              <div className="text-xs text-muted-foreground leading-snug">{description}</div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CreateContentMenu;
