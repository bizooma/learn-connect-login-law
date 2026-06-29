import { useCallback, useEffect, useRef, useState } from "react";

export interface UseResizableColumnsOptions {
  storageKey: string;
  defaults: number[];
  min?: number;
  max?: number;
}

export const useResizableColumns = ({ storageKey, defaults, min = 60, max = 800 }: UseResizableColumnsOptions) => {
  const [widths, setWidths] = useState<number[]>(() => {
    if (typeof window === "undefined") return defaults;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return defaults;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === defaults.length && parsed.every((n) => typeof n === "number")) {
        return parsed;
      }
    } catch {}
    return defaults;
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(widths));
    } catch {}
  }, [widths, storageKey]);

  const dragRef = useRef<{ index: number; startX: number; startWidth: number } | null>(null);

  const onMouseDown = useCallback(
    (index: number) => (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragRef.current = { index, startX: e.clientX, startWidth: widths[index] };

      const handleMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        const delta = ev.clientX - dragRef.current.startX;
        const next = Math.max(min, Math.min(max, dragRef.current.startWidth + delta));
        setWidths((prev) => {
          const copy = [...prev];
          copy[dragRef.current!.index] = next;
          return copy;
        });
      };
      const handleUp = () => {
        dragRef.current = null;
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    },
    [widths, min, max],
  );

  const reset = useCallback(() => setWidths(defaults), [defaults]);

  // Build a grid-template-columns string. Last column is for actions menu (fixed).
  const gridTemplate = widths.map((w) => `${w}px`).join(" ");

  return { widths, gridTemplate, onMouseDown, reset };
};
