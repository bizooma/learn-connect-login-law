
import { useState } from "react";

export const useUIState = () => {
  const [expandedLessons, setExpandedLessons] = useState<Set<number>>(new Set());

  const toggleLessonExpanded = (index: number) => {
    const newExpanded = new Set(expandedLessons);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedLessons(newExpanded);
  };

  return {
    expandedLessons,
    toggleLessonExpanded,
  };
};
