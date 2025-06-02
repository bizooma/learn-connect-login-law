import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useReorderOperations = (onRefetch: () => void) => {
  const { toast } = useToast();

  const reorderModule = async (moduleId: string, direction: 'up' | 'down') => {
    try {
      console.log('=== REORDER MODULE DEBUG ===');
      console.log('Module ID:', moduleId);
      console.log('Direction:', direction);

      // First, check if this is actually a lesson displayed as a module
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('id, sort_order, course_id, module_id, title')
        .eq('id', moduleId)
        .maybeSingle();

      if (lessonData && !lessonError) {
        console.log('Found lesson-as-module, handling special reordering');
        await handleLessonAsModuleReordering(lessonData, direction);
        return;
      }

      // Otherwise, handle as actual module
      const { data: moduleData, error: moduleError } = await supabase
        .from('modules')
        .select('id, sort_order, course_id, title')
        .eq('id', moduleId)
        .maybeSingle();

      if (moduleData && !moduleError) {
        console.log('Found actual module, handling normal reordering');
        await handleActualModuleReordering(moduleData, direction);
        return;
      }

      throw new Error('Item not found in either modules or lessons table');

    } catch (error) {
      console.error('Error reordering module:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reorder module",
        variant: "destructive",
      });
    }
  };

  const handleActualModuleReordering = async (moduleData: any, direction: 'up' | 'down') => {
    console.log('Handling actual module reordering for:', moduleData);
    
    // Get all modules in the same course
    const { data: siblings, error: siblingsError } = await supabase
      .from('modules')
      .select('id, sort_order, title')
      .eq('course_id', moduleData.course_id)
      .order('sort_order');

    if (siblingsError) {
      console.error('Error fetching module siblings:', siblingsError);
      throw siblingsError;
    }

    console.log('Module siblings:', siblings);

    const currentIndex = siblings.findIndex(s => s.id === moduleData.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    console.log('Current index:', currentIndex, 'Target index:', targetIndex);

    if (targetIndex < 0 || targetIndex >= siblings.length) {
      toast({
        title: "Info",
        description: `Cannot move ${direction} - already at ${direction === 'up' ? 'top' : 'bottom'}`,
      });
      return;
    }

    const current = siblings[currentIndex];
    const target = siblings[targetIndex];

    console.log('Swapping modules:', current.title, 'with:', target.title);

    // Swap sort orders with proper error handling
    const { error: updateError1 } = await supabase
      .from('modules')
      .update({ sort_order: target.sort_order })
      .eq('id', current.id);

    if (updateError1) {
      console.error('Error updating first module:', updateError1);
      throw updateError1;
    }

    const { error: updateError2 } = await supabase
      .from('modules')
      .update({ sort_order: current.sort_order })
      .eq('id', target.id);

    if (updateError2) {
      console.error('Error updating second module:', updateError2);
      throw updateError2;
    }

    console.log('Successfully swapped module sort orders');
    toast({
      title: "Success",
      description: "Module reordered successfully",
    });
    onRefetch();
  };

  const handleLessonAsModuleReordering = async (lessonData: any, direction: 'up' | 'down') => {
    console.log('Handling lesson-as-module reordering for:', lessonData);
    
    // For lessons displayed as modules, get all lessons in the same course that share the same module pattern
    // This handles the case where lessons from "Main Module" are displayed as top-level modules
    const { data: siblings, error: siblingsError } = await supabase
      .from('lessons')
      .select('id, sort_order, title, module_id, course_id')
      .eq('course_id', lessonData.course_id)
      .eq('module_id', lessonData.module_id) // Same module context
      .order('sort_order');

    if (siblingsError) {
      console.error('Error fetching lesson siblings:', siblingsError);
      throw siblingsError;
    }

    console.log('Lesson-as-module siblings:', siblings);

    const currentIndex = siblings.findIndex(s => s.id === lessonData.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    console.log('Current index:', currentIndex, 'Target index:', targetIndex);

    if (targetIndex < 0 || targetIndex >= siblings.length) {
      toast({
        title: "Info",
        description: `Cannot move ${direction} - already at ${direction === 'up' ? 'top' : 'bottom'}`,
      });
      return;
    }

    const current = siblings[currentIndex];
    const target = siblings[targetIndex];

    console.log('Swapping lesson-as-module:', current.title, 'with:', target.title);

    // Swap sort orders with proper error handling
    const { error: updateError1 } = await supabase
      .from('lessons')
      .update({ sort_order: target.sort_order })
      .eq('id', current.id);

    if (updateError1) {
      console.error('Error updating first lesson:', updateError1);
      throw updateError1;
    }

    const { error: updateError2 } = await supabase
      .from('lessons')
      .update({ sort_order: current.sort_order })
      .eq('id', target.id);

    if (updateError2) {
      console.error('Error updating second lesson:', updateError2);
      throw updateError2;
    }

    console.log('Successfully swapped lesson-as-module sort orders');
    toast({
      title: "Success",
      description: "Module reordered successfully",
    });
    onRefetch();
  };

  const reorderLesson = async (lessonId: string, direction: 'up' | 'down') => {
    try {
      console.log('=== REORDER LESSON DEBUG ===');
      console.log('Lesson ID:', lessonId);
      console.log('Direction:', direction);

      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('sort_order, module_id, title, course_id')
        .eq('id', lessonId)
        .maybeSingle();

      if (lessonError) {
        console.error('Error fetching lesson:', lessonError);
        throw lessonError;
      }

      if (!lessonData) {
        throw new Error('Lesson not found');
      }

      console.log('Lesson data:', lessonData);

      const { data: siblings, error: siblingsError } = await supabase
        .from('lessons')
        .select('id, sort_order, title')
        .eq('module_id', lessonData.module_id)
        .order('sort_order');

      if (siblingsError) {
        console.error('Error fetching lesson siblings:', siblingsError);
        throw siblingsError;
      }

      console.log('Lesson siblings:', siblings);

      const currentIndex = siblings.findIndex(s => s.id === lessonId);
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

      if (targetIndex < 0 || targetIndex >= siblings.length) {
        toast({
          title: "Info",
          description: `Cannot move ${direction} - already at ${direction === 'up' ? 'top' : 'bottom'}`,
        });
        return;
      }

      const current = siblings[currentIndex];
      const target = siblings[targetIndex];

      console.log('Swapping lessons:', current.title, 'with:', target.title);

      // Swap sort orders
      const { error: updateError1 } = await supabase
        .from('lessons')
        .update({ sort_order: target.sort_order })
        .eq('id', current.id);

      if (updateError1) {
        console.error('Error updating first lesson:', updateError1);
        throw updateError1;
      }

      const { error: updateError2 } = await supabase
        .from('lessons')
        .update({ sort_order: current.sort_order })
        .eq('id', target.id);

      if (updateError2) {
        console.error('Error updating second lesson:', updateError2);
        throw updateError2;
      }

      console.log('Successfully swapped lesson sort orders');
      toast({
        title: "Success",
        description: "Lesson reordered successfully",
      });
      onRefetch();
    } catch (error) {
      console.error('Error reordering lesson:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reorder lesson",
        variant: "destructive",
      });
    }
  };

  const reorderUnit = async (unitId: string, direction: 'up' | 'down') => {
    try {
      console.log('=== REORDER UNIT DEBUG ===');
      console.log('Unit ID:', unitId);
      console.log('Direction:', direction);

      const { data: unitData, error: unitError } = await supabase
        .from('units')
        .select('sort_order, section_id, title')
        .eq('id', unitId)
        .maybeSingle();

      if (unitError) {
        console.error('Error fetching unit:', unitError);
        throw unitError;
      }

      if (!unitData) {
        throw new Error('Unit not found');
      }

      console.log('Unit data:', unitData);

      const { data: siblings, error: siblingsError } = await supabase
        .from('units')
        .select('id, sort_order, title')
        .eq('section_id', unitData.section_id)
        .order('sort_order');

      if (siblingsError) {
        console.error('Error fetching unit siblings:', siblingsError);
        throw siblingsError;
      }

      console.log('Unit siblings:', siblings);

      const currentIndex = siblings.findIndex(s => s.id === unitId);
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

      if (targetIndex < 0 || targetIndex >= siblings.length) {
        toast({
          title: "Info",
          description: `Cannot move ${direction} - already at ${direction === 'up' ? 'top' : 'bottom'}`,
        });
        return;
      }

      const current = siblings[currentIndex];
      const target = siblings[targetIndex];

      console.log('Swapping units:', current.title, 'with:', target.title);

      // Swap sort orders
      const { error: updateError1 } = await supabase
        .from('units')
        .update({ sort_order: target.sort_order })
        .eq('id', current.id);

      if (updateError1) {
        console.error('Error updating first unit:', updateError1);
        throw updateError1;
      }

      const { error: updateError2 } = await supabase
        .from('units')
        .update({ sort_order: current.sort_order })
        .eq('id', target.id);

      if (updateError2) {
        console.error('Error updating second unit:', updateError2);
        throw updateError2;
      }

      console.log('Successfully swapped unit sort orders');
      toast({
        title: "Success",
        description: "Unit reordered successfully",
      });
      onRefetch();
    } catch (error) {
      console.error('Error reordering unit:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reorder unit",
        variant: "destructive",
      });
    }
  };

  return {
    reorderModule,
    reorderLesson,
    reorderUnit,
  };
};
