
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useReorderOperations = (onRefetch: () => void) => {
  const { toast } = useToast();

  const reorderModule = async (moduleId: string, direction: 'up' | 'down') => {
    try {
      console.log('Reordering module:', moduleId, direction);

      // First try modules table
      const { data: moduleData, error: moduleError } = await supabase
        .from('modules')
        .select('sort_order, course_id')
        .eq('id', moduleId)
        .maybeSingle();

      if (moduleData && !moduleError) {
        // Handle actual module reordering
        const { data: siblings, error: siblingsError } = await supabase
          .from('modules')
          .select('id, sort_order')
          .eq('course_id', moduleData.course_id)
          .order('sort_order');

        if (siblingsError) throw siblingsError;

        const currentIndex = siblings.findIndex(s => s.id === moduleId);
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

        // Swap sort orders
        await supabase.from('modules').update({ sort_order: target.sort_order }).eq('id', current.id);
        await supabase.from('modules').update({ sort_order: current.sort_order }).eq('id', target.id);

        toast({
          title: "Success",
          description: "Module reordered successfully",
        });
        onRefetch();
        return;
      }

      // If not found in modules, try lessons table (transformed modules)
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('sort_order, course_id, module_id')
        .eq('id', moduleId)
        .maybeSingle();

      if (lessonData && !lessonError) {
        // Handle lesson reordering (displayed as modules)
        const { data: siblings, error: siblingsError } = await supabase
          .from('lessons')
          .select('id, sort_order')
          .eq('course_id', lessonData.course_id)
          .eq('module_id', lessonData.module_id)
          .order('sort_order');

        if (siblingsError) throw siblingsError;

        const currentIndex = siblings.findIndex(s => s.id === moduleId);
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

        // Swap sort orders
        await supabase.from('lessons').update({ sort_order: target.sort_order }).eq('id', current.id);
        await supabase.from('lessons').update({ sort_order: current.sort_order }).eq('id', target.id);

        toast({
          title: "Success",
          description: "Module reordered successfully",
        });
        onRefetch();
      } else {
        throw new Error('Item not found in either modules or lessons table');
      }
    } catch (error) {
      console.error('Error reordering module:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reorder module",
        variant: "destructive",
      });
    }
  };

  const reorderLesson = async (lessonId: string, direction: 'up' | 'down') => {
    try {
      console.log('Reordering lesson:', lessonId, direction);

      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('sort_order, module_id')
        .eq('id', lessonId)
        .single();

      if (lessonError) throw lessonError;

      const { data: siblings, error: siblingsError } = await supabase
        .from('lessons')
        .select('id, sort_order')
        .eq('module_id', lessonData.module_id)
        .order('sort_order');

      if (siblingsError) throw siblingsError;

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

      // Swap sort orders
      await supabase.from('lessons').update({ sort_order: target.sort_order }).eq('id', current.id);
      await supabase.from('lessons').update({ sort_order: current.sort_order }).eq('id', target.id);

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
      console.log('Reordering unit:', unitId, direction);

      const { data: unitData, error: unitError } = await supabase
        .from('units')
        .select('sort_order, section_id')
        .eq('id', unitId)
        .single();

      if (unitError) throw unitError;

      const { data: siblings, error: siblingsError } = await supabase
        .from('units')
        .select('id, sort_order')
        .eq('section_id', unitData.section_id)
        .order('sort_order');

      if (siblingsError) throw siblingsError;

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

      // Swap sort orders
      await supabase.from('units').update({ sort_order: target.sort_order }).eq('id', current.id);
      await supabase.from('units').update({ sort_order: current.sort_order }).eq('id', target.id);

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
