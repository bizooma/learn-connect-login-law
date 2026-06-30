import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, User as UserIcon, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  profile_image_url?: string | null;
}

const initialsFor = (p: Profile) => {
  const f = (p.first_name?.[0] || "").toUpperCase();
  const l = (p.last_name?.[0] || "").toUpperCase();
  return (f + l) || (p.email?.[0]?.toUpperCase() ?? "?");
};

interface OwnerPickerProps {
  value: string | null;
  ownerDisplay?: Profile | null;
  onChange: (id: string | null) => void;
  disabled?: boolean;
}

const labelFor = (p: Profile | null | undefined) => {
  if (!p) return "Unassigned";
  const name = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
  return name || p.email;
};

const OwnerPicker = ({ value, ownerDisplay, onChange, disabled }: OwnerPickerProps) => {
  const [open, setOpen] = useState(false);
  const [people, setPeople] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open || people.length > 0) return;
    setLoading(true);
    supabase
      .from("profiles")
      .select("id, first_name, last_name, email")
      .eq("is_deleted", false)
      .order("first_name", { ascending: true })
      .limit(500)
      .then(({ data }) => {
        setPeople((data || []) as Profile[]);
        setLoading(false);
      });
  }, [open, people.length]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return people;
    return people.filter((p) => labelFor(p).toLowerCase().includes(q) || p.email.toLowerCase().includes(q));
  }, [people, query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={(e) => e.stopPropagation()}
          className="h-7 px-2 -ml-2 text-xs font-normal text-foreground hover:bg-muted/60 max-w-full justify-start"
        >
          <UserIcon className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
          <span className="truncate">{ownerDisplay ? labelFor(ownerDisplay) : "Unassigned"}</span>
          <ChevronDown className="h-3 w-3 ml-1 text-muted-foreground shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start" onClick={(e) => e.stopPropagation()}>
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search people..." value={query} onValueChange={setQuery} />
          <CommandList>
            {loading && <div className="p-3 text-xs text-muted-foreground">Loading...</div>}
            {!loading && <CommandEmpty>No people found.</CommandEmpty>}
            <CommandGroup>
              {value && (
                <CommandItem
                  onSelect={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                  className="text-muted-foreground"
                >
                  <X className="h-4 w-4 mr-2" /> Clear owner
                </CommandItem>
              )}
              {filtered.map((p) => (
                <CommandItem
                  key={p.id}
                  onSelect={() => {
                    onChange(p.id);
                    setOpen(false);
                  }}
                >
                  <Check className={`h-4 w-4 mr-2 ${value === p.id ? "opacity-100" : "opacity-0"}`} />
                  <div className="flex flex-col min-w-0">
                    <span className="truncate text-sm">{labelFor(p)}</span>
                    <span className="truncate text-[11px] text-muted-foreground">{p.email}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default OwnerPicker;
