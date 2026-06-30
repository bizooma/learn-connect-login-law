import { ReactNode } from "react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface Props {
  width: number;
  onResize?: (e: React.MouseEvent) => void;
  children?: ReactNode;
  className?: string;
}

export const ResizableHead = ({ width, onResize, children, className }: Props) => (
  <TableHead
    style={{ width, minWidth: width, maxWidth: width }}
    className={cn("relative select-none", className)}
  >
    <div className="truncate pr-2">{children}</div>
    {onResize && (
      <span
        onMouseDown={onResize}
        className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary/40 active:bg-primary/60"
      />
    )}
  </TableHead>
);

export default ResizableHead;
