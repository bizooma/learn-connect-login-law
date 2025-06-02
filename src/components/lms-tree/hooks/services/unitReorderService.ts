
import { supabase } from "@/integrations/supabase/client";
import { ReorderConfig } from "../types/reorderTypes";
import { validateReorderBounds, swapSortOrders } from "./reorderUtils";

export const reorderUnit = async (unitId: string, direction: 'up' | 'down', config: ReorderConfig) => {
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

    if (!validateReorderBounds(currentIndex, targetIndex, siblings, direction, config)) {
      return;
    }

    const current = siblings[currentIndex];
    const target = siblings[targetIndex];

    await swapSortOrders('units', current, target, config);
  } catch (error) {
    console.error('Error reordering unit:', error);
    config.toast({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to reorder unit",
      variant: "destructive",
    });
  }
};
