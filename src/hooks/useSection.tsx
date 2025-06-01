
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

type Lesson = Tables<'lessons'>;
type Unit = Tables<'units'>;

interface LessonWithUnits extends Lesson {
  units: Unit[];
}

export const useSection = (id: string | undefined) => {
  const { toast } = useToast();
  const [section, setSection] = useState<LessonWithUnits | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSection = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching lesson:', id);
      
      // Fetch lesson with units
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', id)
        .single();

      if (lessonError) {
        console.error('Error fetching lesson:', lessonError);
        throw lessonError;
      }

      console.log('Lesson data fetched:', lessonData);

      // Fetch units for this lesson
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

      const lessonWithUnits: LessonWithUnits = {
        ...lessonData,
        units: unitsData || []
      };

      setSection(lessonWithUnits);

      // Set first unit as selected by default
      if (unitsData && unitsData.length > 0) {
        setSelectedUnit(unitsData[0]);
      }
    } catch (error) {
      console.error('Error fetching lesson:', error);
      toast({
        title: "Error",
        description: "Failed to load lesson",
        variant: "destructive",
      });
      setSection(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      console.log('useSection: Starting to fetch lesson:', id);
      fetchSection();
    } else {
      console.log('useSection: No lesson ID provided');
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
