
import { useToast } from "@/hooks/use-toast";
import { reorderModule } from "./services/moduleReorderService";
import { reorderLesson } from "./services/lessonReorderService";
import { reorderUnit } from "./services/unitReorderService";
import { ReorderOperations, ReorderConfig } from "./types/reorderTypes";

export const useReorderOperations = (onRefetch: () => void): ReorderOperations => {
  const { toast } = useToast();

  const config: ReorderConfig = {
    onRefetch,
    toast,
  };

  return {
    reorderModule: (moduleId: string, direction: 'up' | 'down') => 
      reorderModule(moduleId, direction, config),
    reorderLesson: (lessonId: string, direction: 'up' | 'down') => 
      reorderLesson(lessonId, direction, config),
    reorderUnit: (unitId: string, direction: 'up' | 'down') => 
      reorderUnit(unitId, direction, config),
  };
};
