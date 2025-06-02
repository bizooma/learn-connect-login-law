
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
        
        // Since modules might actually be lessons in disguise due to data transformation,
        // we need to check both tables and handle accordingly
        
        // First try the modules table
        const { data: activeModule, error: activeModuleError } = await supabase
          .from('modules')
          .select('sort_order, course_id')
          .eq('id', activeItemId)
          .maybeSingle();
          
        const { data: overModule, error: overModuleError } = await supabase
          .from('modules')
          .select('sort_order, course_id')
          .eq('id', overItemId)
          .maybeSingle();
        
        // If both are found in modules table, proceed with module reordering
        if (activeModule && overModule && !activeModuleError && !overModuleError) {
          console.log('Found both items in modules table, proceeding with module reordering');
          
          if (activeModule.course_id !== overModule.course_id) {
            toast({
              title: "Info",
              description: "Modules can only be reordered within the same course",
            });
            return;
          }
          
          const tempSortOrder = activeModule.sort_order;
          
          console.log('Swapping module sort orders:', { 
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
        
        // If not found in modules table, try lessons table (transformed modules)
        const { data: activeLesson, error: activeLessonError } = await supabase
          .from('lessons')
          .select('sort_order, course_id, module_id')
          .eq('id', activeItemId)
          .maybeSingle();
          
        const { data: overLesson, error: overLessonError } = await supabase
          .from('lessons')
          .select('sort_order, course_id, module_id')
          .eq('id', overItemId)
          .maybeSingle();
        
        if (activeLesson && overLesson && !activeLessonError && !overLessonError) {
          console.log('Found both items in lessons table, proceeding with lesson reordering');
          
          if (activeLesson.course_id !== overLesson.course_id) {
            toast({
              title: "Info",
              description: "Items can only be reordered within the same course",
            });
            return;
          }
          
          const tempSortOrder = activeLesson.sort_order;
          
          console.log('Swapping lesson sort orders:', { 
            activeId: activeItemId, 
            newSortOrder: overLesson.sort_order,
            overId: overItemId,
            newSortOrder2: tempSortOrder
          });
          
          const { error: updateError1 } = await supabase
            .from('lessons')
            .update({ sort_order: overLesson.sort_order })
            .eq('id', activeItemId);
            
          if (updateError1) {
            console.error('Error updating active lesson sort order:', updateError1);
            throw new Error(`Failed to update active lesson: ${updateError1.message}`);
          }
            
          const { error: updateError2 } = await supabase
            .from('lessons')
            .update({ sort_order: tempSortOrder })
            .eq('id', overItemId);
            
          if (updateError2) {
            console.error('Error updating target lesson sort order:', updateError2);
            throw new Error(`Failed to update target lesson: ${updateError2.message}`);
          }
          
          console.log('Lesson reordering completed successfully');
          
          toast({
            title: "Success",
            description: "Modules reordered successfully",
          });
          
          onRefetch();
          return;
        }
        
        // If neither found, show error
        console.error('Items not found in either modules or lessons table');
        throw new Error('Unable to find items to reorder');
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
