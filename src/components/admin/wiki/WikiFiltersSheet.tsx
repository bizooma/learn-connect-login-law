import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { WikiCategory, WikiSubjectCategory } from "@/hooks/useWikiCategories";
import { SUBJECT_CATEGORIES } from "@/components/admin/wiki/subjectCategoryMeta";
import type { EffectiveAccess } from "@/hooks/useWikiAccess";

export type AccessOpt = "view" | "edit" | "full";
export type StatusOpt = "published" | "draft";
export type DiscoverabilityOpt = "discoverable" | "request";

export interface WikiFilters {
  groups: string[];
  owners: string[];
  access: AccessOpt[];
  status: StatusOpt[];
  category: WikiSubjectCategory[];
  discoverability: DiscoverabilityOpt[];
}

export const emptyFilters = (): WikiFilters => ({
  groups: [],
  owners: [],
  access: [],
  status: [],
  category: [],
  discoverability: [],
});

export const activeFilterGroupCount = (f: WikiFilters) =>
  (["groups", "owners", "access", "status", "category", "discoverability"] as const)
    .reduce((n, k) => n + (f[k].length > 0 ? 1 : 0), 0);

export const parseFiltersFromParams = (params: URLSearchParams): WikiFilters => {
  const get = (k: string) => (params.get(k) || "").split(",").map((s) => s.trim()).filter(Boolean);
  return {
    groups: get("groups"),
    owners: get("owners"),
    access: get("access").filter((v): v is AccessOpt => ["view", "edit", "full"].includes(v)),
    status: get("status").filter((v): v is StatusOpt => ["published", "draft"].includes(v)),
    category: get("category").filter((v): v is WikiSubjectCategory =>
      ["policy", "procedure", "company"].includes(v),
    ),
    discoverability: get("discoverability").filter((v): v is DiscoverabilityOpt =>
      ["discoverable", "request"].includes(v),
    ),
  };
};

export const writeFiltersToParams = (params: URLSearchParams, f: WikiFilters) => {
  const set = (k: keyof WikiFilters) => {
    if (f[k].length) params.set(k, (f[k] as string[]).join(","));
    else params.delete(k);
  };
  set("groups");
  set("owners");
  set("access");
  set("status");
  set("category");
  set("discoverability");
};

export const matchesFilters = (
  c: WikiCategory,
  f: WikiFilters,
  getAccess: (c: WikiCategory) => EffectiveAccess,
) => {
  if (f.groups.length) {
    const sg = new Set((c.shared_groups || []).map((g) => g.id));
    if (!f.groups.some((id) => sg.has(id))) return false;
  }
  if (f.owners.length) {
    if (!c.owner_id || !f.owners.includes(c.owner_id)) return false;
  }
  if (f.access.length) {
    const a = getAccess(c);
    if (a === "none" || !f.access.includes(a as AccessOpt)) return false;
  }
  if (f.status.length) {
    const s: StatusOpt = c.is_published ? "published" : "draft";
    if (!f.status.includes(s)) return false;
  }
  if (f.category.length) {
    if (!f.category.includes(c.category)) return false;
  }
  if (f.discoverability.length) {
    if (c.discoverability !== "discoverable" && c.discoverability !== "request") return false;
    if (!f.discoverability.includes(c.discoverability as DiscoverabilityOpt)) return false;
  }
  return true;
};

interface Option {
  value: string;
  label: string;
  hint?: string;
}

interface SectionProps {
  title: string;
  placeholder: string;
  options: Option[];
  values: string[];
  onChange: (next: string[]) => void;
}

const FilterSection = ({ title, placeholder, options, values, onChange }: SectionProps) => {
  const [open, setOpen] = useState(true);
  const toggle = (v: string) =>
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-b border-border last:border-b-0">
      <CollapsibleTrigger className="w-full flex items-center justify-between py-3 group">
        <span className="text-sm font-semibold" style={{ color: "#213C82" }}>
          {title}
          {values.length > 0 && (
            <span
              className="ml-2 inline-flex items-center justify-center text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1.5 text-black"
              style={{ backgroundColor: "#FFDA00" }}
            >
              {values.length}
            </span>
          )}
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="pb-3">
        {options.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2">{placeholder}</p>
        ) : (
          <div className="max-h-56 overflow-auto rounded-md border border-border bg-background">
            <ul className="divide-y divide-border">
              {options.map((o) => {
                const checked = values.includes(o.value);
                return (
                  <li key={o.value}>
                    <label
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-muted/40",
                        checked && "bg-muted/30",
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggle(o.value)}
                      />
                      <span className="flex-1 truncate">{o.label}</span>
                      {o.hint && (
                        <span className="text-xs text-muted-foreground">{o.hint}</span>
                      )}
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: WikiCategory[];
  isLoading: boolean;
  initial: WikiFilters;
  onApply: (next: WikiFilters) => void;
  getAccess: (c: WikiCategory) => EffectiveAccess;
}

const WikiFiltersSheet = ({
  open,
  onOpenChange,
  categories,
  isLoading,
  initial,
  onApply,
  getAccess,
}: Props) => {
  const [draft, setDraft] = useState<WikiFilters>(initial);

  useEffect(() => {
    if (open) setDraft(initial);
  }, [open, initial]);

  const groupOptions = useMemo<Option[]>(() => {
    const map = new Map<string, string>();
    categories.forEach((c) =>
      (c.shared_groups || []).forEach((g) => map.set(g.id, g.name)),
    );
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [categories]);

  const ownerOptions = useMemo<Option[]>(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => {
      if (c.owner_id && c.owner) {
        const name =
          [c.owner.first_name, c.owner.last_name].filter(Boolean).join(" ") ||
          c.owner.email;
        map.set(c.owner_id, name);
      }
    });
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [categories]);

  const accessOptions: Option[] = [
    { value: "view", label: "View" },
    { value: "edit", label: "Edit" },
    { value: "full", label: "Full" },
  ];
  const statusOptions: Option[] = [
    { value: "published", label: "Published" },
    { value: "draft", label: "Draft" },
  ];
  const categoryOptions: Option[] = SUBJECT_CATEGORIES.map((c) => ({
    value: c.value,
    label: c.pluralLabel,
  }));
  const discoverabilityOptions: Option[] = [
    { value: "discoverable", label: "Discoverable" },
    { value: "request", label: "Request access" },
  ];

  const matchingCount = useMemo(
    () => categories.filter((c) => matchesFilters(c, draft, getAccess)).length,
    [categories, draft, getAccess],
  );

  const handleClear = () => setDraft(emptyFilters());
  const handleApply = () => {
    onApply(draft);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[360px] p-0 flex flex-col gap-0 bg-white"
      >
        <SheetHeader className="px-5 py-4 border-b border-border flex-row items-center justify-between space-y-0">
          <SheetTitle className="text-lg" style={{ color: "#213C82" }}>
            Filters
          </SheetTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md p-1 hover:bg-muted transition-colors focus:outline-none focus:ring-2"
            style={{ boxShadow: "none" }}
            aria-label="Close filters"
          >
            <X className="h-4 w-4" />
          </button>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5">
          <FilterSection
            title="Groups"
            placeholder="No groups are shared with any subject yet."
            options={groupOptions}
            values={draft.groups}
            onChange={(v) => setDraft({ ...draft, groups: v })}
          />
          <FilterSection
            title="Owner"
            placeholder="No owners assigned yet."
            options={ownerOptions}
            values={draft.owners}
            onChange={(v) => setDraft({ ...draft, owners: v })}
          />
          <FilterSection
            title="My access"
            placeholder="Select access"
            options={accessOptions}
            values={draft.access}
            onChange={(v) => setDraft({ ...draft, access: v as AccessOpt[] })}
          />
          <FilterSection
            title="Status"
            placeholder="Select status"
            options={statusOptions}
            values={draft.status}
            onChange={(v) => setDraft({ ...draft, status: v as StatusOpt[] })}
          />
          <FilterSection
            title="Category"
            placeholder="Select category"
            options={categoryOptions}
            values={draft.category}
            onChange={(v) => setDraft({ ...draft, category: v as WikiSubjectCategory[] })}
          />
          <FilterSection
            title="Discoverability"
            placeholder="Select discoverability"
            options={discoverabilityOptions}
            values={draft.discoverability}
            onChange={(v) =>
              setDraft({ ...draft, discoverability: v as DiscoverabilityOpt[] })
            }
          />
        </div>

        <div className="px-5 py-3 border-t border-border bg-white flex items-center justify-between gap-3 sticky bottom-0">
          <Button variant="outline" onClick={handleClear} className="flex-1">
            Clear
          </Button>
          <Button
            onClick={handleApply}
            disabled={isLoading}
            className="flex-1 text-white hover:opacity-90"
            style={{ backgroundColor: "#213C82" }}
          >
            Apply ({matchingCount})
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default WikiFiltersSheet;
