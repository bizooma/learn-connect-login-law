
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
      
      // Parse the active item type and ID - fix the parsing to get full UUIDs
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
        // Reclassify lesson to module
        const { data, error } = await supabase.rpc('reclassify_section_to_module', {
          p_section_id: activeItemId,
          p_course_id: overItemId
        });
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Lesson reclassified to module successfully",
        });
        
        onRefetch();
      } else if (activeType === 'unit' && overType === 'module') {
        // Reclassify unit to lesson
        const { data, error } = await supabase.rpc('reclassify_unit_to_section', {
          p_unit_id: activeItemId,
          p_module_id: overItemId
        });
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Unit reclassified to lesson successfully",
        });
        
        onRefetch();
      } else if (activeType === 'lesson' && overType === 'module') {
        // Move lesson to different module
        const { data, error } = await supabase.rpc('move_content_to_level', {
          p_content_id: activeItemId,
          p_content_type: 'section',
          p_target_parent_id: overItemId,
          p_target_parent_type: 'module'
        });
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Lesson moved to module successfully",
        });
        
        onRefetch();
      } else if (activeType === 'unit' && overType === 'lesson') {
        // Move unit to different lesson
        const { data, error } = await supabase.rpc('move_content_to_level', {
          p_content_id: activeItemId,
          p_content_type: 'unit',
          p_target_parent_id: overItemId,
          p_target_parent_type: 'section'
        });
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Unit moved to lesson successfully",
        });
        
        onRefetch();
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
