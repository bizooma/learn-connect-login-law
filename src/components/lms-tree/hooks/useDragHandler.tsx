
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
      
      console.log('Drag operation:', { activeType, activeItemId, overType, overItemId });
      
      // Handle module to module reordering (same level drag)
      if (activeType === 'module' && overType === 'module' && activeItemId !== overItemId) {
        // Get both modules to swap their sort orders
        const { data: activeModule, error: activeError } = await supabase
          .from('modules')
          .select('sort_order, course_id')
          .eq('id', activeItemId)
          .single();
          
        const { data: overModule, error: overError } = await supabase
          .from('modules')
          .select('sort_order, course_id')
          .eq('id', overItemId)
          .single();
          
        if (activeError || overError || !activeModule || !overModule) {
          throw new Error('Failed to fetch module data for reordering');
        }
        
        // Only allow reordering within the same course
        if (activeModule.course_id !== overModule.course_id) {
          toast({
            title: "Info",
            description: "Modules can only be reordered within the same course",
          });
          return;
        }
        
        // Swap the sort orders
        const tempSortOrder = activeModule.sort_order;
        
        await supabase
          .from('modules')
          .update({ sort_order: overModule.sort_order })
          .eq('id', activeItemId);
          
        await supabase
          .from('modules')
          .update({ sort_order: tempSortOrder })
          .eq('id', overItemId);
        
        toast({
          title: "Success",
          description: "Modules reordered successfully",
        });
        
        onRefetch();
        return;
      }
      
      // Handle reclassification based on drag target
      if (activeType === 'lesson' && overType === 'course') {
        toast({
          title: "Info",
          description: "This item is already at the module level",
        });
      } else if (activeType === 'unit' && overType === 'lesson') {
        // Units are lessons in our structure, so move to different lesson (module)
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
          description: "This type of reordering is not supported",
        });
      }
    } catch (error) {
      console.error('Error during drag operation:', error);
      toast({
        title: "Error",
        description: "Failed to reorder content",
        variant: "destructive",
      });
    }
  };

  return { handleDragEnd };
};
