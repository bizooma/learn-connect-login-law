import { Eye, X } from "lucide-react";
import { usePreviewAsStaff } from "@/hooks/usePreviewAsStaff";

/**
 * Sticky banner shown site-wide (wherever mounted) while an admin is
 * previewing the wiki as a non-admin staff member.
 */
const PreviewAsStaffBanner = () => {
  const { enabled, disable } = usePreviewAsStaff();
  if (!enabled) return null;

  return (
    <div
      className="w-full flex items-center justify-between gap-4 px-4 py-2 text-sm border-b border-black/10"
      style={{ backgroundColor: "#213C82", color: "#FFDA00" }}
      role="status"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Eye className="h-4 w-4 shrink-0" />
        <span className="truncate">
          You are previewing the wiki as a non-admin staff member. Edit controls are hidden.
        </span>
      </div>
      <button
        type="button"
        onClick={disable}
        className="inline-flex items-center gap-1 rounded-md bg-[#FFDA00] text-[#213C82] px-2 py-1 text-xs font-semibold hover:opacity-90"
      >
        <X className="h-3.5 w-3.5" /> Exit preview
      </button>
    </div>
  );
};

export default PreviewAsStaffBanner;
