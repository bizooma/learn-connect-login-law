
export interface ReorderOperations {
  reorderModule: (moduleId: string, direction: 'up' | 'down') => Promise<void>;
  reorderLesson: (lessonId: string, direction: 'up' | 'down') => Promise<void>;
  reorderUnit: (unitId: string, direction: 'up' | 'down') => Promise<void>;
}

export interface ReorderConfig {
  onRefetch: () => void;
  toast: (options: {
    title: string;
    description: string;
    variant?: "destructive" | "default";
  }) => void;
}

export interface SiblingItem {
  id: string;
  sort_order: number;
  title: string;
}
