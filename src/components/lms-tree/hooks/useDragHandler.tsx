
import { DragEndEvent } from '@dnd-kit/core';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useDragHandler = (onRefetch: () => void) => {
  const { toast } = useToast();
  
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }

    console.log('Drag ended:', { active: active.id, over: over.id });
    
    try {
      const activeId = active.id as string;
      const overId = over.id as string;
      
      // Parse the active item type and ID
      const activeMatch = activeId.match(/^(course|module|lesson|unit)-(.+)$/);
      const overMatch = overId.match(/^(course|module|lesson|unit)-(.+)$/);
      
      if (!activeMatch || !overMatch) {
        console.error('Invalid drag item IDs:', { activeId, overId });
        return;
      }
      
      const [, activeType, activeItemId] = activeMatch;
      const [, overType, overItemId] = overMatch;
      
      console.log('Reclassification attempt:', { activeType, activeItemId, overType, overItemId });
      
      // Handle reclassification based on drag target
      if (activeType === 'lesson' && overType === 'course') {
        // In our current structure, "lessons" are actually modules, so we don't need to reclassify
        toast({
          title: "Info",
          description: "This item is already at the module level",
        });
      } else if (activeType === 'unit' && overType === 'lesson') {
        // Units are already lessons in our structure, so move to different lesson (module)
        const { error } = await supabase
          .from('lessons')
          .update({ module_id: overItemId })
          .eq('id', activeItemId);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Content moved successfully",
        });
        
        onRefetch();
      } else if (activeType === 'unit' && overType === 'module') {
        // Move unit (lesson) to different module
        const { error } = await supabase
          .from('lessons')
          .update({ module_id: overItemId })
          .eq('id', activeItemId);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Content moved successfully",
        });
        
        onRefetch();
      } else {
        toast({
          title: "Info",
          description: "This reclassification is not supported for the current structure",
        });
      }
    } catch (error) {
      console.error('Error during reclassification:', error);
      toast({
        title: "Error",
        description: "Failed to reclassify content",
        variant: "destructive",
      });
    }
  };

  return { handleDragEnd };
};
