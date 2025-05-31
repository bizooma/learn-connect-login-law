
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

type Section = Tables<'sections'>;
type Unit = Tables<'units'>;

interface SectionWithUnits extends Section {
  units: Unit[];
}

export const useSection = (id: string | undefined) => {
  const { toast } = useToast();
  const [section, setSection] = useState<SectionWithUnits | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSection = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching section:', id);
      
      // Fetch section with units
      const { data: sectionData, error: sectionError } = await supabase
        .from('sections')
        .select('*')
        .eq('id', id)
        .single();

      if (sectionError) {
        console.error('Error fetching section:', sectionError);
        throw sectionError;
      }

      console.log('Section data fetched:', sectionData);

      // Fetch units for this section
      const { data: unitsData, error: unitsError } = await supabase
        .from('units')
        .select('*')
        .eq('section_id', id)
        .order('sort_order', { ascending: true });

      if (unitsError) {
        console.error('Error fetching units:', unitsError);
        throw unitsError;
      }

      console.log('Units data fetched:', unitsData);

      const sectionWithUnits: SectionWithUnits = {
        ...sectionData,
        units: unitsData || []
      };

      setSection(sectionWithUnits);

      // Set first unit as selected by default
      if (unitsData && unitsData.length > 0) {
        setSelectedUnit(unitsData[0]);
      }
    } catch (error) {
      console.error('Error fetching section:', error);
      toast({
        title: "Error",
        description: "Failed to load section",
        variant: "destructive",
      });
      setSection(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      console.log('useSection: Starting to fetch section:', id);
      fetchSection();
    } else {
      console.log('useSection: No section ID provided');
      setLoading(false);
    }
  }, [id]);

  return {
    section,
    selectedUnit,
    setSelectedUnit,
    loading
  };
};
