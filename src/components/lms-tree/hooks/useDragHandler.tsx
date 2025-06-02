
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
        console.log('Attempting to reorder modules:', { activeItemId, overItemId });
        
        // Get both modules to swap their sort orders
        const { data: activeModule, error: activeError } = await supabase
          .from('modules')
          .select('sort_order, course_id')
          .eq('id', activeItemId)
          .single();
          
        if (activeError) {
          console.error('Error fetching active module:', activeError);
          throw new Error(`Failed to fetch active module: ${activeError.message}`);
        }
          
        const { data: overModule, error: overError } = await supabase
          .from('modules')
          .select('sort_order, course_id')
          .eq('id', overItemId)
          .single();
          
        if (overError) {
          console.error('Error fetching over module:', overError);
          throw new Error(`Failed to fetch target module: ${overError.message}`);
        }
        
        if (!activeModule || !overModule) {
          throw new Error('Module data not found');
        }
        
        console.log('Module data fetched:', { activeModule, overModule });
        
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
        
        console.log('Swapping sort orders:', { 
          activeId: activeItemId, 
          newSortOrder: overModule.sort_order,
          overId: overItemId,
          newSortOrder2: tempSortOrder
        });
        
        const { error: updateError1 } = await supabase
          .from('modules')
          .update({ sort_order: overModule.sort_order })
          .eq('id', activeItemId);
          
        if (updateError1) {
          console.error('Error updating active module sort order:', updateError1);
          throw new Error(`Failed to update active module: ${updateError1.message}`);
        }
          
        const { error: updateError2 } = await supabase
          .from('modules')
          .update({ sort_order: tempSortOrder })
          .eq('id', overItemId);
          
        if (updateError2) {
          console.error('Error updating target module sort order:', updateError2);
          throw new Error(`Failed to update target module: ${updateError2.message}`);
        }
        
        console.log('Module reordering completed successfully');
        
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
        description: error instanceof Error ? error.message : "Failed to reorder content",
        variant: "destructive",
      });
    }
  };

  return { handleDragEnd };
};
