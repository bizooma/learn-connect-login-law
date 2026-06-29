import { createContext, useContext, ReactNode } from "react";
import { useResizableColumns } from "@/hooks/useResizableColumns";

// Columns: Name, Items, Category, Status, Shared with, Owner, Actions
const DEFAULTS = [320, 90, 130, 110, 160, 100, 60];

type Ctx = ReturnType<typeof useResizableColumns>;
const WikiColumnsContext = createContext<Ctx | null>(null);

export const WikiColumnsProvider = ({ children }: { children: ReactNode }) => {
  const value = useResizableColumns({
    storageKey: "wiki-content-column-widths-v1",
    defaults: DEFAULTS,
    min: 60,
    max: 800,
  });
  return <WikiColumnsContext.Provider value={value}>{children}</WikiColumnsContext.Provider>;
};

export const useWikiColumns = () => {
  const ctx = useContext(WikiColumnsContext);
  if (!ctx) throw new Error("useWikiColumns must be used inside WikiColumnsProvider");
  return ctx;
};
